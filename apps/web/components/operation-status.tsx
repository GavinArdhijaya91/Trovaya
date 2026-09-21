import type { OperationState } from "@trovaya/protocol-sdk";

const EXPLORER_BY_CHAIN: Record<number, string> = {
  97: "https://testnet.bscscan.com",
  56: "https://bscscan.com",
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
};

function explorerTxUrl(hash: string): string | null {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return null;
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 97);
  const base = EXPLORER_BY_CHAIN[chainId];
  return base ? `${base}/tx/${hash}` : null;
}

function getUserMessage(state: OperationState) {
  const raw = state.error?.message ?? state.message;

  if (raw?.toLowerCase().includes("failed to fetch")) {
    return "Koneksi layanan sedang bermasalah. Silakan coba lagi.";
  }

  return raw;
}

export function OperationStatus({ state }: { state: OperationState }) {
  if (state.phase === "idle") return null;

  const failed = state.phase === "failed";
  const indexing = state.phase === "indexing";
  const message = getUserMessage(state);
  const proofUrl = state.transactionHash ? explorerTxUrl(state.transactionHash) : null;

  return (
    <div
      aria-live="polite"
      className={`mt-3 rounded-xl p-3 text-xs ${
        failed ? "bg-red-50 text-red-700" : indexing ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-mint text-leaf"
      }`}
    >
      <p className="font-semibold">
        {indexing && <span aria-hidden className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-700 border-t-transparent align-[-2px]" />}
        {message}
      </p>
      {indexing && (
        <p className="mt-1 leading-5">Transaksi sudah tercatat on-chain. Menunggu jaringan memantulkan status baru…</p>
      )}
      {state.transactionHash && (
        <p className="mt-1 break-all">
          {proofUrl ? (
            <a href={proofUrl} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
              View blockchain proof →
            </a>
          ) : (
            <>Nomor bukti: {state.transactionHash}</>
          )}
        </p>
      )}
    </div>
  );
}
