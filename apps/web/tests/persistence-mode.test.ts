import assert from "node:assert/strict";
import test from "node:test";
import { contentUri, resolvePersistenceMode } from "../lib/persistence-mode.ts";

test("Pinata is reported only when every artifact was persisted", () => {
  assert.equal(resolvePersistenceMode([
    { cid: "bafy-preview", mode: "pinata" },
    { cid: "bafy-vault", mode: "pinata" },
  ]), "pinata");
  assert.equal(resolvePersistenceMode([
    { cid: "bafy-preview", mode: "pinata" },
    { cid: "demo-vault", mode: "demo" },
  ]), "demo");
});

test("demo identifiers are never formatted as IPFS URIs", () => {
  assert.equal(contentUri({ cid: "bafy-real", mode: "pinata" }), "ipfs://bafy-real");
  assert.equal(contentUri({ cid: "demo-deadbeef", mode: "demo" }), "demo://demo-deadbeef");
});
