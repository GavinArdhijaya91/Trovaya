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
});
