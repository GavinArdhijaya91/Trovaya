import { createHash } from "node:crypto";
import { ethers } from "hardhat";

const baseUrl = "http://localhost:3000";
const tokenId = "14";
const chainId = "97";

async function testUnauthorized() {
  const rogue = ethers.Wallet.createRandom();
  console.log("Testing Unauthorized Wallet:", rogue.address);

  const challengeRes = await fetch(`${baseUrl}/api/vault/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: rogue.address,
      purpose: "deliver_key",
      tokenId,
      chainId,
    }),
  });
  const challenge = await challengeRes.json();
  const signature = await rogue.signMessage(challenge.message);

  const pair = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
  publicKey.alg = "RSA-OAEP-256";

  const deliverRes = await fetch(`${baseUrl}/api/vault/keys/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: rogue.address,
      signature,
      challengeId: challenge.challengeId,
      message: challenge.message,
      publicKey,
    }),
  });
  console.log("Unauthorized status (expect 403):", deliverRes.status);
  const data = await deliverRes.json();
  console.log("Unauthorized response message:", data.detail);
  if (deliverRes.status !== 403) throw new Error("Expected 403 for unauthorized delivery");
  return "denied";
}

async function testAuthorized() {
  const buyerPrivateKey = "0x532b61459b0d6e77b7d8be8f756a959b9b6898e82625c30276b7ebdf9c4deead";
  const buyer = new ethers.Wallet(buyerPrivateKey, ethers.provider);
  console.log("\nTesting Authorized Buyer Wallet:", buyer.address);

  const challengeRes = await fetch(`${baseUrl}/api/vault/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: buyer.address,
      purpose: "deliver_key",
      tokenId,
      chainId,
    }),
  });
  const challenge = await challengeRes.json();
  const signature = await buyer.signMessage(challenge.message);

  const pair = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
  publicKey.alg = "RSA-OAEP-256";

  const deliverRes = await fetch(`${baseUrl}/api/vault/keys/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: buyer.address,
      signature,
      challengeId: challenge.challengeId,
      message: challenge.message,
      publicKey,
    }),
  });
  console.log("Authorized status (expect 200):", deliverRes.status);
  const result = await deliverRes.json();
  console.log("Delivery algorithm:", result.algorithm);
  console.log("Encrypted Vault CID:", result.encryptedVaultCid);
  console.log("Wrapped key length:", result.wrappedKey?.length);

  // Unwrap content key with WebCrypto RSA-OAEP private key
  const wrappedBytes = Uint8Array.from(Buffer.from(result.wrappedKey, "base64"));
  const unwrappedRaw = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, pair.privateKey, wrappedBytes);
  const contentKeyBytes = new Uint8Array(unwrappedRaw);
  console.log("Successfully unwrapped AES content key bytes:", contentKeyBytes.length);

  // Fetch encrypted vault file from dedicated gateway
  const encRes = await fetch(`https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/${result.encryptedVaultCid}`);
  const encArrayBuffer = await encRes.arrayBuffer();
  console.log("Fetched ciphertext from IPFS, size:", encArrayBuffer.byteLength, "bytes");

  // Decrypt with AES-GCM (IV 12 bytes, ciphertext + tag)
  const payload = new Uint8Array(encArrayBuffer);
  const aesKey = await crypto.subtle.importKey("raw", contentKeyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: payload.slice(0, 12) }, aesKey, payload.slice(12));
  const decryptedBuf = Buffer.from(decrypted);
  const fileHash = createHash("sha256").update(decryptedBuf).digest("hex");
  console.log("Decrypted file successfully! Size:", decryptedBuf.length, "bytes");
  console.log("Decrypted file SHA-256:", fileHash);
  return { fileHash, result };
}

async function main() {
  await testUnauthorized();
  const { fileHash, result } = await testAuthorized();
  console.log("\n==========================================");
  console.log("ALL VAULT DELIVERY & DECRYPTION TESTS PASS!");
  console.log("Decrypted Plaintext SHA-256:", fileHash);
  console.log("==========================================");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
