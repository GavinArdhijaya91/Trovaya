import type { PinResult } from "@/lib/ipfs-api";

export type PersistenceMode = PinResult["mode"];

export function resolvePersistenceMode(results: PinResult[]): PersistenceMode {
  return results.length > 0 && results.every((result) => result.mode === "pinata")
    ? "pinata"
    : "demo";
}

export function contentUri(result: PinResult): string {
  return result.mode === "pinata" ? `ipfs://${result.cid}` : `demo://${result.cid}`;
}
