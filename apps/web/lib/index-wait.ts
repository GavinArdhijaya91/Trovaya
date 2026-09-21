/**
 * Bounded wait for the indexing layer (event indexer -> database -> gallery API).
 *
 * Chain confirmation is fast and authoritative; the public index lags behind it.
 * The UI must be able to say "sudah dicatat on-chain, sedang diperbarui" instead
 * of claiming the work is ready. This helper never throws and never blocks a
 * flow: a timeout simply means "still indexing", not "failed".
 */
export const INDEX_WAIT_ATTEMPTS = 5;
export const INDEX_WAIT_DELAY_MS = 2_000;

export interface IndexWaitOptions {
  tokenId: string;
  /** Returns true when the asset record is readable from the index layer. */
  probe: () => Promise<boolean>;
  attempts?: number;
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export async function waitForIndexedToken(options: IndexWaitOptions): Promise<boolean> {
  const attempts = options.attempts ?? INDEX_WAIT_ATTEMPTS;
  const delayMs = options.delayMs ?? INDEX_WAIT_DELAY_MS;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await probeSafely(options.probe)) return true;
    if (attempt < attempts - 1) await sleep(delayMs);
  }
  return false;
}

async function probeSafely(probe: () => Promise<boolean>): Promise<boolean> {
  try {
    return await probe();
  } catch {
    return false;
  }
}

/** Browser probe against the public gallery API used by the creator flow. */
export function createIndexProbe(tokenId: string): () => Promise<boolean> {
  return async () => {
    const response = await fetch("/api/assets", { cache: "no-store" });
    if (!response.ok) return false;
    const payload = (await response.json()) as { assets?: { token_id?: unknown }[] };
    if (!Array.isArray(payload.assets)) return false;
    return payload.assets.some((asset) => String(asset.token_id) === tokenId);
  };
}
