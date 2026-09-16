"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { HelpTip } from "./help-tip";
import { uiTerms } from "@/lib/terminology";

function splitShare(feeWei: string | undefined, members: number) {
  if (!feeWei) return "-";
  try {
    const fee = BigInt(feeWei);
    return formatEther(fee / BigInt(members));
  } catch {
    return "-";
  }
}

export function LicensePreview({ feeWei, currency = "BNB" }: { feeWei?: string; currency?: string }) {
  const [learning, setLearning] = useState(false);
  const feeLabel = feeWei
    ? (() => {
        try {
          return `${formatEther(BigInt(feeWei))} ${currency}`;
        } catch {
          return `— ${currency}`;
        }
      })()
    : "Lihat harga pada karya";
  return <>
    <button type="button" onClick={() => setLearning(true)} className="rounded-xl bg-leaf px-4 py-2 text-sm font-semibold text-white">Belajar dulu sebelum beli</button>
    {learning && <div role="dialog" aria-modal="true" aria-labelledby="learn-title" className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft">
        <h2 id="learn-title" className="text-2xl font-semibold">Hak penggunaan komersial</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Pembelian memberi bukti lisensi komersial non-eksklusif untuk karya ini. Kepemilikan hak cipta dan token tidak otomatis berpindah.</p>
        <div className="mt-5 space-y-3 rounded-2xl bg-sand p-4 text-sm">
          <p className="flex justify-between"><span>Harga lisensi kreator</span><strong>{feeLabel}</strong></p>
          <p className="flex justify-between"><span>{uiTerms.gasFee}<HelpTip>Diestimasi otomatis oleh dompet saat konfirmasi (gas aktual ~60-90k, bukan limit). Nilai yang tampil di popup adalah batas atas, bukan yang dibayar.</HelpTip></span><strong>Ikut estimasi dompet</strong></p>
          <p className="flex justify-between border-t pt-3"><span>Sisa saldo akun</span><strong>Dihitung saat akun terhubung</strong></p>
        </div>
        {feeWei && <div className="mt-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-xs leading-6 text-teal-900">
          <p className="font-semibold">Patungan (3-5 orang, dibagi rata):</p>
          <p>3 orang → {splitShare(feeWei, 3)} {currency}/orang · 4 orang → {splitShare(feeWei, 4)} {currency}/orang · 5 orang → {splitShare(feeWei, 5)} {currency}/orang</p>
          <p className="mt-1 text-teal-800">On-chain tetap 1x bayar oleh ketua grup, sisanya urunan off-chain.</p>
        </div>}
        <button type="button" onClick={() => setLearning(false)} className="mt-5 w-full rounded-xl bg-ink px-4 py-3 font-semibold text-white">Saya mengerti</button>
      </div>
    </div>}
  </>;
}
