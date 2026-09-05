"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function WalletConnectedBanner() {
  const { isConnected, address } = useAccount();
  const [dismissed, setDismissed] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted || !isConnected || dismissed) return null;

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  return (
    <div
      role="banner"
      className="relative z-20 flex items-center justify-between gap-3 px-5 py-3 md:px-8"
      style={{
        background: "linear-gradient(90deg, #085041 0%, #0F6E56 60%, #1D9E75 100%)",
      }}
    >
      {/* Left: wallet info */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-200/20 text-base">
          🔗
        </span>
        <p className="text-sm text-teal-50 leading-snug">
          <span className="font-mono text-xs text-teal-200 bg-white/10 px-2 py-0.5 rounded-md">{short}</span>
          <span className="ml-2 hidden sm:inline text-teal-100">
            Klik Buka Workspace untuk mulai mendaftarkan karya
          </span>
        </p>
      </div>

      {/* Right: CTA + dismiss */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/dashboard"
          className="rounded-lg bg-white/15 border border-white/25 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/25 transition-colors backdrop-blur-sm flex items-center gap-1.5"
        >
          <span>Buka Workspace</span>
          <span aria-hidden>→</span>
        </Link>
        <button
          type="button"
          aria-label="Tutup banner"
          onClick={() => setDismissed(true)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-teal-200 hover:bg-white/10 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
