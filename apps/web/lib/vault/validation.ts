import type { JsonWebKey as NodeJsonWebKey } from "node:crypto";

export function parseTokenId(value: unknown): string | null {
  if (typeof value !== "string" || !/^[1-9]\d{0,77}$/.test(value)) return null;
  return value;
}

export function parseChallengeId(value: unknown): string | null {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value : null;
}

export function parseChallengeMessage(value: unknown): string | null {
  return typeof value === "string" && value.length >= 100 && value.length <= 512
    && value.startsWith("Trovaya secure vault\n") ? value : null;
}

export function parseBuyerPublicKey(value: unknown): NodeJsonWebKey | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const key = value as Record<string, unknown>;
  if (key.kty !== "RSA" || key.alg !== "RSA-OAEP-256" || key.key_ops !== undefined
      && (!Array.isArray(key.key_ops) || key.key_ops.some((operation) => operation !== "encrypt"))) return null;
  if (typeof key.n !== "string" || key.n.length < 300 || key.n.length > 400
      || !/^[A-Za-z0-9_-]+$/.test(key.n) || key.e !== "AQAB") return null;
  return value as NodeJsonWebKey;
}

export function isCanonicalIpfsCid(value: string): boolean {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(value)
    || /^bafy[a-z2-7]{20,100}$/.test(value);
}
