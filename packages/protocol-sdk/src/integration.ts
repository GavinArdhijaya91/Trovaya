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
  if (rawMessage.includes("network") || rawMessage.includes("fetch") || rawMessage.includes("rpc")) {
    return { code: "network_error", message: "Jaringan belum dapat dihubungi. Coba kembali.", retryable: true };
  }
  return {
    code: "transaction_failed",
    message: "Transaksi belum dapat diselesaikan. Periksa akun dan coba kembali.",
    retryable: true,
  };
}
