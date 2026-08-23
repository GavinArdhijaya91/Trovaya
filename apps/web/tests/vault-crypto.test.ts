import assert from "node:assert/strict";
import test from "node:test";
import { constants, generateKeyPairSync, privateDecrypt, randomBytes } from "node:crypto";
import { openContentKey, sealContentKey, wrapForBuyer } from "../lib/vault/crypto.ts";

test("content key is authenticated at rest and bound to token context", () => {
  const key = randomBytes(32);
  const master = randomBytes(32);
  const sealed = sealContentKey(key, master, "97:1");
  assert.deepEqual(openContentKey(sealed, master, "97:1"), key);
  assert.throws(() => openContentKey(sealed, master, "97:2"));
  assert.notEqual(sealed.encryptedKey, key.toString("base64"));
});

test("buyer receives only an RSA-OAEP-256 wrapped content key", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, publicExponent: 0x10001 });
  const jwk = publicKey.export({ format: "jwk" });
  jwk.alg = "RSA-OAEP-256";
  const key = randomBytes(32);
  const wrapped = wrapForBuyer(key, jwk);
  const opened = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, Buffer.from(wrapped, "base64"));
  assert.deepEqual(opened, key);
});
