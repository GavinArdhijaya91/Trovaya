import { constants, createCipheriv, createDecipheriv, createPublicKey, publicEncrypt, randomBytes } from "node:crypto";
import type { JsonWebKey as NodeJsonWebKey } from "node:crypto";

export interface SealedKey { encryptedKey: string; iv: string; authTag: string; }

export function sealContentKey(key: Buffer, masterKey: Buffer, context: string): SealedKey {
  if (key.length !== 32 || masterKey.length !== 32) throw new Error("AES-256 keys must contain 32 bytes.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey, iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([cipher.update(key), cipher.final()]);
  return { encryptedKey: encrypted.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

export function openContentKey(sealed: SealedKey, masterKey: Buffer, context: string): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", masterKey, Buffer.from(sealed.iv, "base64"));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(sealed.authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(sealed.encryptedKey, "base64")), decipher.final()]);
}

export function wrapForBuyer(key: Buffer, publicJwk: NodeJsonWebKey): string {
  if (publicJwk.kty !== "RSA" || publicJwk.alg !== "RSA-OAEP-256" || !publicJwk.n || !publicJwk.e) {
    throw new Error("Buyer public key must be RSA-OAEP-256 JWK.");
  }
  const publicKey = createPublicKey({ key: publicJwk, format: "jwk" });
  if (publicKey.asymmetricKeyDetails?.modulusLength !== 2048) throw new Error("Buyer RSA key must be 2048 bits.");
  return publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, key).toString("base64");
}
