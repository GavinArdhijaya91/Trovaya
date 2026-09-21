/** Stable lifecycle shared by wallet-backed frontend operations. */
export type OperationPhase =
  | "idle"
  | "preparing"
  | "awaiting_wallet"
  | "submitted"
  | "confirming"
  | "indexing"
  | "completed"
  | "failed";

export type IntegrationErrorCode =
  | "configuration_missing"
  | "wallet_required"
  | "user_rejected"
  | "chain_mismatch"
  | "network_error"
  | "transaction_failed"
  | "service_unavailable"
  | "validation_failed"
  | "unknown";

export interface IntegrationError {
  code: IntegrationErrorCode;
  message: string;
  retryable: boolean;
}

export interface PaymentMethod {
  symbol: string;
  address: string; // address(0) for BNB
  decimals: number;
  displayName: string;
}

export const SUPPORTED_PAYMENT_METHODS: Record<string, PaymentMethod> = {
  BNB: { symbol: "BNB", address: "0x0000000000000000000000000000000000000000", decimals: 18, displayName: "BNB" },
  USDT: { symbol: "USDT", address: "0x55d39833adef184cacd482325d58e842a7c620bf", decimals: 18, displayName: "Tether USDT" },
  PAXG: { symbol: "PAXG", address: "0x0b6a53580310e963221873149471576617538123", decimals: 18, displayName: "Pax Gold" },
  XAUT: { symbol: "XAUT", address: "0x1388c764839479841564887c52c7445544d6536c", decimals: 18, displayName: "Tether Gold" },
};

export interface OperationState {
  phase: OperationPhase;
  message: string;
  transactionHash?: `0x${string}`;
  error?: IntegrationError;
}

export interface TransactionSignals {
  hash?: `0x${string}`;
  isWalletPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  /**
   * The chain already accepted the transaction, but the indexing layer has not
   * published the new record yet. Additive and optional so existing consumers
   * keep working. Callers that cannot observe indexing simply omit it.
   */
  isIndexing?: boolean;
  error?: unknown;
}

export const operationMessages: Record<OperationPhase, string> = {
  idle: "Siap diproses",
  preparing: "Menyiapkan data",
  awaiting_wallet: "Menunggu persetujuan akun digital",
  submitted: "Transaksi telah dikirim",
  confirming: "Mencatat bukti di jaringan",
  indexing: "Memperbarui data karya",
  completed: "Proses berhasil",
  failed: "Proses belum berhasil",
};

/** Converts provider-specific wallet state into one UI-facing contract. */
export function deriveTransactionState(signals: TransactionSignals): OperationState {
  if (signals.error) {
    return {
      phase: "failed",
      message: operationMessages.failed,
      transactionHash: signals.hash,
      error: normalizeIntegrationError(signals.error),
    };
  }
  // Confirmation is not completion: a confirmed transaction whose record is not
  // readable yet must not be presented as a finished, usable result.
  if (signals.isIndexing) {
    return { phase: "indexing", message: operationMessages.indexing, transactionHash: signals.hash };
  }
  if (signals.isSuccess) {
    return { phase: "completed", message: operationMessages.completed, transactionHash: signals.hash };
  }
  if (signals.isConfirming) {
    return { phase: "confirming", message: operationMessages.confirming, transactionHash: signals.hash };
  }
  if (signals.hash) {
    return { phase: "submitted", message: operationMessages.submitted, transactionHash: signals.hash };
  }
  if (signals.isWalletPending) {
    return { phase: "awaiting_wallet", message: operationMessages.awaiting_wallet };
  }
  return { phase: "idle", message: operationMessages.idle };
}

/** Keeps raw provider errors out of UI components and user-facing copy. */
export function normalizeIntegrationError(error: unknown): IntegrationError {
  const candidate = error as { code?: number | string; message?: string; shortMessage?: string } | null;
  const rawMessage = `${candidate?.shortMessage ?? candidate?.message ?? ""}`.toLowerCase();
  if (candidate?.code === 4001 || rawMessage.includes("user rejected") || rawMessage.includes("user denied")) {
    return { code: "user_rejected", message: "Persetujuan transaksi dibatalkan.", retryable: true };
  }
  if (candidate?.code === 4902 || rawMessage.includes("chain mismatch")
      || rawMessage.includes("chain is not configured") || rawMessage.includes("unsupported chain")) {
    return { code: "chain_mismatch", message: "Jaringan akun tidak sesuai dengan jaringan Trovaya.", retryable: true };
  }
  if (rawMessage.includes("network") || rawMessage.includes("fetch") || rawMessage.includes("rpc")) {
    return { code: "network_error", message: "Jaringan belum dapat dihubungi. Coba kembali.", retryable: true };
  }
  if (rawMessage.includes("insufficient funds") || rawMessage.includes("insufficient balance")) {
    return { code: "transaction_failed", message: "Saldo tidak mencukupi untuk transaksi ini.", retryable: true };
  }
  return {
    code: "transaction_failed",
    message: "Transaksi belum dapat diselesaikan. Periksa akun dan coba kembali.",
    retryable: true,
  };
}
