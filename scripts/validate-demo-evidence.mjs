import { existsSync, readFileSync } from "node:fs";

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error("Usage: pnpm demo:evidence <evidence.json>");
  process.exit(1);
}

const evidence = JSON.parse(readFileSync(file, "utf8"));
const address = (value) => /^0x[0-9a-fA-F]{40}$/.test(value ?? "") && !/^0x0{40}$/i.test(value);
const hash = (value) => /^0x[0-9a-fA-F]{64}$/.test(value ?? "") && !/^0x0{64}$/i.test(value);
const sha256 = (value) => /^[0-9a-fA-F]{64}$/.test(value ?? "") && !/^0{64}$/i.test(value);
const commit = (value) => /^[0-9a-f]{40}$/i.test(value ?? "") && !/^0{40}$/.test(value);
const cid = (value) => /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(value ?? "")
  || /^bafy[a-z2-7]{20,100}$/.test(value ?? "");
const isoDate = (value) => typeof value === "string"
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  && Number.isFinite(Date.parse(value));
const checks = [
  ["unique run identifier", /^[A-Za-z0-9._-]{8,100}$/.test(evidence.runId ?? "")],
  ["source commit", commit(evidence.commit)],
  ["run start timestamp", isoDate(evidence.startedAt)],
  ["run end timestamp", isoDate(evidence.completedAt)
    && Date.parse(evidence.completedAt) >= Date.parse(evidence.startedAt)],
  ["BSC testnet chain", evidence.chainId === 97],
  ["IP NFT deployment", address(evidence.deployments?.ipNft)],
  ["Vault deployment", address(evidence.deployments?.vault)],
  ["separate deployment addresses", evidence.deployments?.ipNft?.toLowerCase()
    !== evidence.deployments?.vault?.toLowerCase()],
  ["IP NFT deployment transaction", hash(evidence.deployments?.ipNftTransaction)],
  ["Vault deployment transaction", hash(evidence.deployments?.vaultTransaction)],
  ["creator wallet", address(evidence.creatorWallet)],
  ["buyer wallet", address(evidence.buyerWallet)],
  ["separate creator and buyer", evidence.creatorWallet?.toLowerCase() !== evidence.buyerWallet?.toLowerCase()],
  ["Pinata persistence mode", evidence.persistence?.mode === "pinata"],
  ["public preview CID", cid(evidence.persistence?.publicPreviewCid)],
  ["encrypted vault CID", cid(evidence.persistence?.encryptedVaultCid)],
  ["metadata CID", cid(evidence.persistence?.metadataCid)],
  ["license terms CID", cid(evidence.persistence?.licenseTermsCid)],
  ["mint transaction", hash(evidence.transactions?.mint)],
  ["license transaction", hash(evidence.transactions?.licensePurchase)],
  ["vault authorization transaction", hash(evidence.transactions?.vaultAuthorization)],
  ["indexed token", /^\d+$/.test(evidence.indexing?.tokenId ?? "")],
  ["gallery visible", evidence.indexing?.galleryVisible === true],
  ["private fields absent", evidence.indexing?.privateFieldsAbsent === true],
  ["content key registered", evidence.delivery?.keyRegistered === true],
  ["authorized delivery completed", evidence.delivery?.status === "delivered"],
  ["RSA-OAEP delivery envelope", evidence.delivery?.algorithm === "RSA-OAEP-256"],
  ["decrypted file integrity", sha256(evidence.delivery?.decryptedFileSha256)],
  ["unauthorized delivery denied", evidence.delivery?.unauthorizedStatus === "denied"],
  ["expired or revoked delivery denied", evidence.delivery?.expiredOrRevokedStatus === "denied"],
  ["no sensitive material recorded", evidence.delivery?.sensitiveMaterialRecorded === false],
  ["maximum image dimensions exercised", evidence.hostMetrics?.imageWidth === 4096
    && evidence.hostMetrics?.imageHeight === 4096],
  ["finite protection latency", Number.isFinite(evidence.hostMetrics?.protectionLatencyMs)
    && evidence.hostMetrics.protectionLatencyMs > 0],
  ["finite peak memory", Number.isFinite(evidence.hostMetrics?.peakMemoryMiB)
    && evidence.hostMetrics.peakMemoryMiB > 0],
  ["fallback evidence", Array.isArray(evidence.fallbacksVerified) && evidence.fallbacksVerified.length >= 3],
];

for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
