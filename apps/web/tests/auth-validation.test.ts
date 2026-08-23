import assert from "node:assert/strict";
import test from "node:test";
import { isValidEmail, isValidOtp, maskEmail, normalizeEmail, normalizeOtp } from "../lib/auth-validation.ts";

test("email validation normalizes and rejects malformed values", () => {
  assert.equal(normalizeEmail("  Creator@Example.COM "), "creator@example.com");
  assert.equal(isValidEmail("creator@example.com"), true);
  assert.equal(isValidEmail("creator@example"), false);
  assert.equal(isValidEmail("creator @example.com"), false);
});

test("OTP input keeps exactly six numeric digits", () => {
  assert.equal(normalizeOtp("12a 34-567"), "123456");
  assert.equal(isValidOtp("123456"), true);
  assert.equal(isValidOtp("12345"), false);
  assert.equal(isValidOtp("12345a"), false);
});

test("email masking preserves routing context without showing the full address", () => {
  assert.equal(maskEmail("creator@example.com"), "cr•••••@example.com");
  assert.equal(maskEmail("a@example.com"), "a••@example.com");
});
