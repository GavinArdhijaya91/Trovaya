import assert from "node:assert/strict";
import test from "node:test";
import { createLicenseTerms, verifyLicenseTermsJson } from "../lib/license-terms.ts";

test("license artifact is deterministic and covers required terms", () => {
  const input = { durationDays: 365, territory: "Global", permittedUse: "Campaign", exclusive: false, sublicensingAllowed: false, allowAITraining: false };
  const first = createLicenseTerms(input);
  const second = createLicenseTerms(input);
  assert.equal(first.hash, second.hash);
  assert.deepEqual(JSON.parse(first.json), { schema: "trovaya-commercial-license", version: 1, licenseType: "commercial", ...input });
});

test("buyer verifies the exact serialized terms against the recorded hash", () => {
  const artifact = createLicenseTerms({ durationDays: 90, territory: "Indonesia", permittedUse: "Kemasan", exclusive: false, sublicensingAllowed: false, allowAITraining: false });
  assert.equal(verifyLicenseTermsJson(artifact.json, artifact.hash).territory, "Indonesia");
  assert.throws(() => verifyLicenseTermsJson(artifact.json.replace("Indonesia", "Global"), artifact.hash));
});

test("license artifact rejects incomplete or unreasonable terms", () => {
  assert.throws(() => createLicenseTerms({ durationDays: 0, territory: "", permittedUse: "", exclusive: false, sublicensingAllowed: false, allowAITraining: false }));
});
