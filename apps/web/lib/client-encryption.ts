export interface EncryptedAsset {
  encryptedBlob: Blob;
  keyBase64: string;
}

export async function encryptOriginal(file: File): Promise<EncryptedAsset> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, await file.arrayBuffer());
  const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  const payload = new Uint8Array(iv.length + ciphertext.byteLength);
  payload.set(iv);
  payload.set(new Uint8Array(ciphertext), iv.length);
  return {
    encryptedBlob: new Blob([payload], { type: "application/octet-stream" }),
    keyBase64: bytesToBase64(rawKey),
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
