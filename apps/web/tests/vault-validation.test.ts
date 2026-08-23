import assert from "node:assert/strict";
import test from "node:test";
import { isCanonicalIpfsCid, parseBuyerPublicKey, parseChallengeId, parseChallengeMessage, parseTokenId } from "../lib/vault/validation.ts";

test("vault identifiers reject oversized and ambiguous numeric input", () => {
  assert.equal(parseTokenId("1"), "1");
  assert.equal(parseTokenId("0"), null);
  assert.equal(parseTokenId("01"), null);
  assert.equal(parseTokenId("9".repeat(79)), null);
  assert.equal(parseChallengeId("550e8400-e29b-41d4-a716-446655440000"), "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(parseChallengeId("not-a-uuid"), null);
});

test("secure delivery accepts canonical IPFS references only", () => {
  assert.equal(isCanonicalIpfsCid(`Qm${"a".repeat(44)}`), true);
  assert.equal(isCanonicalIpfsCid(`bafy${"a".repeat(30)}`), true);
  assert.equal(isCanonicalIpfsCid("demo-deadbeef"), false);
  assert.equal(isCanonicalIpfsCid("ipfs://QmExample"), false);
});

test("challenge messages and buyer keys are strictly bounded", () => {
  assert.equal(parseChallengeMessage(`Trovaya secure vault\n${"x".repeat(100)}`)?.startsWith("Trovaya"), true);
  assert.equal(parseChallengeMessage("x".repeat(513)), null);
  const key = { kty: "RSA", alg: "RSA-OAEP-256", e: "AQAB", n: "A".repeat(342), key_ops: ["encrypt"] };
  assert.deepEqual(parseBuyerPublicKey(key), key);
  assert.equal(parseBuyerPublicKey({ ...key, e: "Aw" }), null);
  assert.equal(parseBuyerPublicKey({ ...key, n: "A".repeat(10_000) }), null);
});
