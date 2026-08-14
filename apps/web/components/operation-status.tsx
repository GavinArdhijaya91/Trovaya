import type { OperationState } from "@trovaya/protocol-sdk";

export function OperationStatus({ state }: { state: OperationState }) {
  if (state.phase === "idle") return null;
  const failed = state.phase === "failed";
  return (
    <div aria-live="polite" className={`mt-3 rounded-xl p-3 text-xs ${failed ? "bg-red-50 text-red-700" : "bg-mint text-leaf"}`}>
      <p className="font-semibold">{state.error?.message ?? state.message}</p>
      {state.transactionHash && <p className="mt-1 break-all">Nomor bukti: {state.transactionHash}</p>}
    </div>
  );
}
