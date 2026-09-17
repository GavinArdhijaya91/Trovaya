export class ServiceRequestError extends Error {
  readonly status?: number;
  readonly retryable: boolean;

  constructor(message: string, status?: number, retryable = false) {
    super(message);
    this.name = "ServiceRequestError";
    this.status = status;
    this.retryable = retryable;
  }
}

export async function requestJson<T>(
  url: string,
  init: RequestInit,
  options: { attempts?: number; baseDelayMs?: number; timeoutMs?: number; fetcher?: typeof fetch } = {},
): Promise<T> {
  const attempts = options.attempts ?? 2;
  const fetcher = options.fetcher ?? fetch;
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 3) throw new Error("attempts must be between 1 and 3");

  // Hard timeout per attempt so a hung service fails fast on stage instead of hanging the demo.
  const timeoutMs = options.timeoutMs ?? 30_000;
  let finalError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const signal = init.signal ?? AbortSignal.timeout(timeoutMs);
      const response = await fetcher(url, { ...init, signal });
      const result = await response.json().catch(() => null) as (T & { detail?: string }) | null;
      if (response.ok && result !== null) return result;
      const retryable = response.status === 502 || response.status === 503 || response.status === 504;
      throw new ServiceRequestError(result?.detail ?? "Layanan belum dapat merespons.", response.status, retryable);
    } catch (error) {
      finalError = error instanceof TypeError
        ? new ServiceRequestError("Layanan tidak dapat dihubungi.", undefined, true)
        : error;
      const retryable = finalError instanceof ServiceRequestError && finalError.retryable;
      if (!retryable || attempt === attempts) throw finalError;
      await new Promise((resolve) => setTimeout(resolve, (options.baseDelayMs ?? 250) * 2 ** (attempt - 1)));
    }
  }
  throw finalError;
}
