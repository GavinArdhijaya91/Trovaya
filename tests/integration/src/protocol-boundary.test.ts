import assert from "node:assert/strict";
import test from "node:test";
import { deriveTransactionState, trovayaIPNFTAbi, trovayaVaultAbi, trovayaChains } from "@trovaya/protocol-sdk";

test("generated SDK exposes integration-critical contract operations", () => {
  const nftNames = new Set<string>(trovayaIPNFTAbi.map((entry) => "name" in entry ? entry.name : ""));
  const vaultNames = new Set<string>(trovayaVaultAbi.map((entry) => "name" in entry ? entry.name : ""));
  for (const name of ["mintIPFor", "IPMinted", "purchaseCommercialLicense", "LicensePurchased"]) assert(nftNames.has(name));
  for (const name of ["unlockWithHumanProof", "unlockWithLicense", "VaultAccessGranted"]) assert(vaultNames.has(name));
  assert.equal(trovayaChains.bscTestnet.id, 97);
});

test("SDK exposes a stable frontend transaction lifecycle", () => {
  assert.equal(deriveTransactionState({ isWalletPending: false, isConfirming: false, isSuccess: false }).phase, "idle");
  assert.equal(deriveTransactionState({ isWalletPending: true, isConfirming: false, isSuccess: false }).phase, "awaiting_wallet");
  assert.equal(deriveTransactionState({ hash: "0x123", isWalletPending: false, isConfirming: true, isSuccess: false }).phase, "confirming");
  assert.equal(deriveTransactionState({ hash: "0x123", isWalletPending: false, isConfirming: false, isSuccess: true }).phase, "completed");
  assert.equal(deriveTransactionState({ isWalletPending: false, isConfirming: false, isSuccess: false, error: { code: 4001 } }).error?.code, "user_rejected");
  assert.deepEqual(
    deriveTransactionState({ isWalletPending: false, isConfirming: false, isSuccess: false, error: { code: 4902 } }).error,
    { code: "chain_mismatch", message: "Jaringan akun tidak sesuai dengan jaringan Trovaya.", retryable: true },
  );
});
