"use client";

import { formatEther } from "viem";
import { HelpTip } from "./help-tip";
import { uiTerms } from "@/lib/terminology";
import type { PurchaseQuote } from "@/hooks/use-purchase-quote";

function row(label: string, value: string) {
  return (
    <p className="flex justify-between gap-4">
      <span>{label}</span>
      <strong className="text-right">{value}</strong>
    </p>
  );
}

/**
 * Rincian biaya UAT-friendly: 3 baris yang 1:1 dengan popup wallet —
 * (1) harga lisensi persis on-chain, (2) estimasi batas-atas jaringan,
 * (3) total maksimal. Tidak ada lagi angka hardcode.
 */
export function PurchaseCostBreakdown({
  quote,
  currency = "BNB",
  memberCount = 1,
}: {
  quote: PurchaseQuote;
  currency?: string;
  memberCount?: number;
}) {
  const feeLabel = quote.chainFeeWei ?? quote.indexedFeeWei;
  return (
    <div className="rounded-2xl bg-sand p-4 text-sm">
      {row(
        "Harga lisensi kreator",
        feeLabel ? `${formatEther(BigInt(feeLabel))} ${currency}` : "Memuat…",
      )}
      {row(
        uiTerms.gasFee,
        quote.gasCostWei
          ? `≤ ${formatEther(BigInt(quote.gasCostWei))} ${currency}`
          : "Ikut estimasi dompet",
      )}
      <div className="mt-2 border-t pt-3">
        {row(
          "Total maksimal di popup",
          quote.totalMaxWei
            ? `${formatEther(BigInt(quote.totalMaxWei))} ${currency}`
            : feeLabel
              ? `${formatEther(BigInt(feeLabel))} ${currency} + gas`
              : "…",
        )}
      </div>
      {quote.matches === false && (
        <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">
          Harga galeri berbeda dari harga on-chain. Yang berlaku adalah harga on-chain
          ({feeLabel ? `${formatEther(BigInt(feeLabel))} ${currency}` : "…"}).{" "}
          <HelpTip>Harga kreator tercatat di smart contract. Galeri hanya cermin — jika berbeda, kontrak yang menang.</HelpTip>
        </p>
      )}
      {memberCount > 1 && feeLabel && (
        <p className="mt-2 text-xs text-stone-500">
          Patungan {memberCount} orang → ± {formatEther(BigInt(feeLabel) / BigInt(memberCount))} {currency}/orang
          (belum termasuk gas, gas hanya dibayar ketua 1x).
        </p>
      )}
      <p className="mt-2 text-[11px] leading-5 text-stone-400">
        Gas aktual yang dibayar biasanya lebih kecil dari batas atas — sisanya tidak jadi terpotong.
      </p>
    </div>
  );
}
