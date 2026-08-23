import assert from "node:assert/strict";
import test from "node:test";
import { requestJson, ServiceRequestError } from "../lib/service-request.ts";

test("service failure preserves safe server detail and status", async () => {
  const fetcher = async () => Response.json({ detail: "Secure vault belum dikonfigurasi." }, { status: 503 });
  await assert.rejects(
    requestJson("/vault", {}, { attempts: 1, fetcher }),
    (error: unknown) => error instanceof ServiceRequestError
      && error.status === 503 && error.retryable && error.message === "Secure vault belum dikonfigurasi.",
  );
});

test("transient service response is retried within the explicit bound", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return calls === 1 ? Response.json({ detail: "busy" }, { status: 503 }) : Response.json({ status: "ok" });
  };
  assert.deepEqual(await requestJson<{ status: string }>("/service", {}, { attempts: 2, baseDelayMs: 0, fetcher }), { status: "ok" });
  assert.equal(calls, 2);
});

test("validation failures are not retried", async () => {
  let calls = 0;
  const fetcher = async () => { calls += 1; return Response.json({ detail: "invalid" }, { status: 400 }); };
  await assert.rejects(requestJson("/service", {}, { attempts: 3, baseDelayMs: 0, fetcher }), /invalid/);
  assert.equal(calls, 1);
});
