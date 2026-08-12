import assert from "node:assert/strict";
import test from "node:test";
import { trovayaIPNFTAbi, trovayaVaultAbi, trovayaChains } from "@trovaya/protocol-sdk";

test("generated SDK exposes integration-critical contract operations", () => {
  const nftNames = new Set<string>(trovayaIPNFTAbi.map((entry) => "name" in entry ? entry.name : ""));
  const vaultNames = new Set<string>(trovayaVaultAbi.map((entry) => "name" in entry ? entry.name : ""));
  for (const name of ["mintIPFor", "IPMinted", "purchaseCommercialLicense", "LicensePurchased"]) assert(nftNames.has(name));
  for (const name of ["unlockWithHumanProof", "unlockWithLicense", "VaultAccessGranted"]) assert(vaultNames.has(name));
  assert.equal(trovayaChains.bscTestnet.id, 97);
});
