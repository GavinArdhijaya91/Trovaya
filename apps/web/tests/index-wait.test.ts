import assert from "node:assert/strict";
import test from "node:test";
import { waitForIndexedToken } from "../lib/index-wait.ts";

const noSleep = async () => undefined;

test("returns true as soon as the index publishes the token", async () => {
  let calls = 0;
  const indexed = await waitForIndexedToken({
    tokenId: "14",
    attempts: 5,
    delayMs: 0,
    sleep: noSleep,
    probe: async () => {
      calls += 1;
      return calls === 3;
    },
  });

  assert.equal(indexed, true);
  assert.equal(calls, 3);
});

test("a timeout reports 'still indexing' instead of failing the flow", async () => {
  let calls = 0;
  const indexed = await waitForIndexedToken({
    tokenId: "15",
    attempts: 4,
    delayMs: 0,
    sleep: noSleep,
    probe: async () => {
      calls += 1;
      return false;
    },
  });

  assert.equal(indexed, false);
  assert.equal(calls, 4);
});

test("an unreachable index is awaited, not thrown", async () => {
  let calls = 0;
  const indexed = await waitForIndexedToken({
    tokenId: "16",
    attempts: 3,
    delayMs: 0,
    sleep: noSleep,
    probe: async () => {
      calls += 1;
      throw new Error("index unavailable");
    },
  });

  assert.equal(indexed, false);
  assert.equal(calls, 3);
});
