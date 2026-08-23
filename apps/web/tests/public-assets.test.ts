import assert from "node:assert/strict";
import test from "node:test";
import { parsePublicAssets, PUBLIC_ASSET_FIELDS } from "../lib/public-assets.ts";

const validAsset = {
  id: "05eadfe6-3a5a-4b29-b1bf-acd6b07966cb",
  chain_id: 97,
  token_id: "1",
  creator_wallet: "0x0000000000000000000000000000000000000001",
  allow_ai_training: false,
  public_poisoned_cid: "QmPublic",
  commercial_license_fee_wei: "100",
  token_uri: "ipfs://QmMetadata",
  license_terms_uri: "ipfs://QmTerms",
  license_terms_hash: `0x${"1".repeat(64)}`,
  license_terms_version: 1,
  license_duration_seconds: "31536000",
  status: "MINTED",
  created_at: "2026-08-23T00:00:00.000Z",
};

test("public asset parser returns only allowlisted gallery fields", () => {
  const [asset] = parsePublicAssets([{
    ...validAsset,
    encrypted_vault_cid: "QmPrivateReference",
    decryption_key: "must-never-leave-the-server",
    kyc_document: "private-document",
    session_token: "private-session",
  }]);

  assert.deepEqual(Object.keys(asset), [...PUBLIC_ASSET_FIELDS]);
  assert.equal("encrypted_vault_cid" in asset, false);
  assert.equal("decryption_key" in asset, false);
  assert.equal("kyc_document" in asset, false);
  assert.equal("session_token" in asset, false);
});

test("public asset parser fails closed on an unexpected response shape", () => {
  assert.throws(() => parsePublicAssets({ assets: [validAsset] }));
  assert.throws(() => parsePublicAssets([{ ...validAsset, chain_id: "97" }]));
  assert.throws(() => parsePublicAssets([{ ...validAsset, creator_wallet: null }]));
});
