import { generateKeyPairSync, privateDecrypt, constants, createHash } from "node:crypto";
import { ethers } from "ethers";

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

  const { publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "jwk" },
  });

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
  console.log("Unauthorized response:", data);
  if (deliverRes.status !== 403) throw new Error("Expected 403 for unauthorized delivery");
  return "denied";
}

async function testAuthorized() {
  const buyerPrivateKey = process.env.TEST_BUYER_PRIVATE_KEY;
  if (!buyerPrivateKey) throw new Error("TEST_BUYER_PRIVATE_KEY env required for authorized vault test (use an unfunded test key)");
  const buyer = new ethers.Wallet(buyerPrivateKey);
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

  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "jwk" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

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

  const wrappedBuffer = Buffer.from(result.wrappedKey, "base64");
  const contentKey = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    wrappedBuffer
  );
  console.log("Successfully unwrapped AES content key (bytes):", contentKey.length);

  const encRes = await fetch(`https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/${result.encryptedVaultCid}`);
  const encArrayBuffer = await encRes.arrayBuffer();
  console.log("Fetched ciphertext from IPFS, size:", encArrayBuffer.byteLength, "bytes");

  const encBytes = new Uint8Array(encArrayBuffer);
  const iv = encBytes.slice(0, 12);
  const ciphertextWithTag = encBytes.slice(12);

  const cryptoKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    cryptoKey,
    ciphertextWithTag
  );
  const decryptedBuf = Buffer.from(decrypted);
  const fileHash = createHash("sha256").update(decryptedBuf).digest("hex");
  console.log("Decrypted file successfully! Size:", decryptedBuf.length, "bytes");
  console.log("Decrypted file SHA-256:", fileHash);
  return { fileHash, result };
}

async function run() {
  await testUnauthorized();
  const { fileHash, result } = await testAuthorized();
  console.log("\nALL TESTS PASSED! Decrypted SHA-256:", fileHash);
}
run().catch(console.error);
