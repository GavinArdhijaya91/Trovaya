import test from "node:test";
import assert from "node:assert/strict";
import { ASSET_QUALITY_POLICY, inspectAssetFile } from "../lib/asset-quality.ts";

test("asset quality policy rejects unsupported formats before reading dimensions", async () => {
  const file = new File(["not an image"], "notes.txt", { type: "text/plain" });
  await assert.rejects(inspectAssetFile(file), /Format karya harus PNG, JPG, atau WebP/);
});

test("asset quality policy rejects files above the maximum size", async () => {
  const file = new File([new Uint8Array(ASSET_QUALITY_POLICY.maxBytes + 1)], "large.png", { type: "image/png" });
  await assert.rejects(inspectAssetFile(file), /Ukuran karya maksimum adalah 15 MiB/);
});