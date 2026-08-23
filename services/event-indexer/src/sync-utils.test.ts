import assert from "node:assert/strict";
import test from "node:test";
import { chunkRanges, confirmedHead, requiresFullReplay, rollbackBlock, withRetry } from "./sync-utils.js";

test("splits inclusive block ranges without gaps", () => {
  assert.deepEqual(chunkRanges(10n, 25n, 7n), [[10n, 16n], [17n, 23n], [24n, 25n]]);
  assert.deepEqual(chunkRanges(2n, 1n, 10n), []);
});

test("confirmation head never underflows", () => {
  assert.equal(confirmedHead(100n, 6n), 94n);
  assert.equal(confirmedHead(3n, 6n), null);
});

test("rollback respects deployment start block", () => {
  assert.equal(rollbackBlock(100n, 12n, 50n), 88n);
  assert.equal(rollbackBlock(55n, 12n, 50n), 50n);
});

test("a near-start reorg forces replay including the deployment block", () => {
  assert.equal(requiresFullReplay(60n, 12n, 50n), true);
  assert.equal(requiresFullReplay(63n, 12n, 50n), false);
});

test("retry succeeds within a bounded attempt count", async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls += 1;
    if (calls < 3) throw new Error("temporary");
    return "ok";
  }, { attempts: 3, baseDelayMs: 0, maxDelayMs: 0 });
  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("retry returns the final error after exhaustion", async () => {
  let calls = 0;
  await assert.rejects(withRetry(async () => {
    calls += 1;
    throw new Error("offline");
  }, { attempts: 2, baseDelayMs: 0, maxDelayMs: 0 }), /offline/);
  assert.equal(calls, 2);
});
