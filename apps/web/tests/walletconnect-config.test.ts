import assert from "node:assert/strict";
import test from "node:test";
import { isValidWalletConnectProjectId } from "../lib/walletconnect-config.ts";

test("WalletConnect is disabled for missing and placeholder project IDs", () => {
  assert.equal(isValidWalletConnectProjectId(undefined), false);
  assert.equal(isValidWalletConnectProjectId(""), false);
  assert.equal(isValidWalletConnectProjectId("replace-with-project-id"), false);
  assert.equal(isValidWalletConnectProjectId("development-project-id"), false);
});

test("WalletConnect accepts a 32-character hexadecimal project ID", () => {
  assert.equal(isValidWalletConnectProjectId("0123456789abcdef0123456789abcdef"), true);
  assert.equal(isValidWalletConnectProjectId("738dc48b158fcb775d33dd42483b62faz"), false);
  assert.equal(isValidWalletConnectProjectId("738dc48b158fcb775d33dd42483b62fa728"), false);
});
