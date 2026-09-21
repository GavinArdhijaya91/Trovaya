import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { deriveTransactionState } from "@trovaya/protocol-sdk";
import { OperationStatus } from "../components/operation-status";

afterEach(cleanup);

describe("OperationStatus failure paths", () => {
  it("renders wallet rejection as an accessible non-technical message", () => {
    render(<OperationStatus state={deriveTransactionState({
      isWalletPending: false, isConfirming: false, isSuccess: false, error: { code: 4001 },
    })} />);
    expect(screen.getByText("Persetujuan transaksi dibatalkan.")).toBeTruthy();
    expect(screen.getByText("Persetujuan transaksi dibatalkan.").closest("div")?.getAttribute("aria-live")).toBe("polite");
  });

  it("renders chain mismatch without leaking provider internals", () => {
    render(<OperationStatus state={deriveTransactionState({
      isWalletPending: false, isConfirming: false, isSuccess: false,
      error: { code: 4902, message: "RPC secret internal stack" },
    })} />);
    expect(screen.getByText("Jaringan akun tidak sesuai dengan jaringan Trovaya.")).toBeTruthy();
    expect(screen.queryByText(/RPC secret/i)).toBeNull();
  });

  it("never claims success while the index is still catching up", () => {
    const state = deriveTransactionState({
      hash: `0x${"a".repeat(64)}`,
      isWalletPending: false, isConfirming: false, isSuccess: true, isIndexing: true,
    });

    expect(state.phase).toBe("indexing");

    render(<OperationStatus state={state} />);
    expect(screen.getByText("Memperbarui data karya")).toBeTruthy();
    expect(screen.queryByText("Proses berhasil")).toBeNull();
  });

  it("reports completion only once the indexed record is readable", () => {
    const state = deriveTransactionState({
      hash: `0x${"a".repeat(64)}`,
      isWalletPending: false, isConfirming: false, isSuccess: true, isIndexing: false,
    });

    expect(state.phase).toBe("completed");
    render(<OperationStatus state={state} />);
    expect(screen.getByText("Proses berhasil")).toBeTruthy();
  });
});
