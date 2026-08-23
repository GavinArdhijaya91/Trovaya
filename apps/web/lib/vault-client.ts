export interface VaultChallenge { challengeId: string; message: string; expiresAt: string; }

async function requestChallenge(walletAddress: string, tokenId: string, purpose: "register_key" | "deliver_key"): Promise<VaultChallenge> {
  const response = await fetch("/api/vault/challenge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ walletAddress, tokenId, purpose }) });
  const result = await response.json() as VaultChallenge & { detail?: string };
  if (!response.ok) throw new Error(result.detail ?? "Challenge vault gagal dibuat.");
  return result;
}

export async function registerContentKey(input: { walletAddress: string; tokenId: string; contentKey: string; signMessage: (message: string) => Promise<string> }) {
  const challenge = await requestChallenge(input.walletAddress, input.tokenId, "register_key");
  const signature = await input.signMessage(challenge.message);
  const response = await fetch("/api/vault/keys/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...challenge, walletAddress: input.walletAddress, signature, contentKey: input.contentKey }) });
  const result = await response.json() as { status?: string; detail?: string };
  if (!response.ok) throw new Error(result.detail ?? "Content key gagal didaftarkan.");
  return result;
}

export async function deliverContentKey(input: { walletAddress: string; tokenId: string; signMessage: (message: string) => Promise<string> }): Promise<{ keyBase64: string; encryptedVaultCid: string }> {
  const pair = await crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, false, ["encrypt", "decrypt"]);
  const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
  publicKey.alg = "RSA-OAEP-256";
  const challenge = await requestChallenge(input.walletAddress, input.tokenId, "deliver_key");
  const signature = await input.signMessage(challenge.message);
  const response = await fetch("/api/vault/keys/deliver", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...challenge, walletAddress: input.walletAddress, signature, publicKey }) });
  const result = await response.json() as { wrappedKey?: string; encryptedVaultCid?: string; detail?: string };
  if (!response.ok || !result.wrappedKey || !result.encryptedVaultCid) throw new Error(result.detail ?? "Content key tidak dapat dikirim.");
  const wrapped = Uint8Array.from(atob(result.wrappedKey), (character) => character.charCodeAt(0));
  const opened = new Uint8Array(await crypto.subtle.decrypt({ name: "RSA-OAEP" }, pair.privateKey, wrapped));
  return { keyBase64: bytesToBase64(opened), encryptedVaultCid: result.encryptedVaultCid };
}

export async function decryptVaultFile(encrypted: ArrayBuffer, keyBase64: string): Promise<Blob> {
  const payload = new Uint8Array(encrypted);
  if (payload.length < 29) throw new Error("Encrypted vault payload tidak valid.");
  const key = await crypto.subtle.importKey("raw", base64ToBytes(keyBase64), { name: "AES-GCM" }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: payload.slice(0, 12) }, key, payload.slice(12));
  return new Blob([plaintext]);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
