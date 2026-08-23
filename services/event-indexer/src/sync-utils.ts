export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export function confirmedHead(latest: bigint, confirmations: bigint): bigint | null {
  if (confirmations < 0n) throw new Error("confirmations cannot be negative");
  return latest < confirmations ? null : latest - confirmations;
}

export function chunkRanges(from: bigint, to: bigint, size: bigint): Array<readonly [bigint, bigint]> {
  if (size <= 0n) throw new Error("chunk size must be positive");
  if (from > to) return [];

  const ranges: Array<readonly [bigint, bigint]> = [];
  for (let start = from; start <= to; start += size) {
    const end = start + size - 1n > to ? to : start + size - 1n;
    ranges.push([start, end]);
  }
  return ranges;
}

export function rollbackBlock(cursor: bigint, depth: bigint, startBlock: bigint): bigint {
  const candidate = cursor > depth ? cursor - depth : 0n;
  return candidate < startBlock ? startBlock : candidate;
}

export function requiresFullReplay(cursor: bigint, depth: bigint, startBlock: bigint): boolean {
  return cursor <= startBlock + depth;
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  if (options.attempts < 1) throw new Error("retry attempts must be at least one");
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === options.attempts) break;
      const delayMs = Math.min(options.baseDelayMs * 2 ** (attempt - 1), options.maxDelayMs);
      options.onRetry?.(error, attempt, delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
