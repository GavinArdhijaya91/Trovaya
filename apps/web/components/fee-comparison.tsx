"use client";

import { useState } from "react";
import { HelpTip } from "./help-tip";
import { uiTerms } from "@/lib/terminology";

export function FeeComparison() {
  const [registrations, setRegistrations] = useState(10);
  const traditional = registrations * 1_500_000;
  const trovaya = registrations * 16;
  return <section className="rounded-3xl bg-ink p-6 text-white md:p-8">
    <p className="text-sm font-semibold text-emerald-300">PERBANDINGAN TRANSPARAN</p>
    <h2 className="mt-2 text-2xl font-semibold">Hitung biaya perlindungan karya</h2>
    <label className="mt-6 block text-sm">Jumlah karya: <strong>{registrations}</strong>
      <input className="mt-3 w-full accent-emerald-400" type="range" min="1" max="100" value={registrations} onChange={(e) => setRegistrations(Number(e.target.value))} />
    </label>
    <div className="mt-5 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-white/10 p-4"><span className="text-xs text-slate-300">Broker tradisional</span><strong className="mt-1 block">Rp{traditional.toLocaleString("id-ID")}</strong></div>
      <div className="rounded-2xl bg-emerald-400/20 p-4"><span className="text-xs text-emerald-200">Trovaya (estimasi)</span><strong className="mt-1 block">Rp{trovaya.toLocaleString("id-ID")}</strong></div>
    </div>
    <p className="mt-4 text-xs text-slate-300">{uiTerms.gasFee}<HelpTip>Estimasi biaya untuk mencatat transaksi pada jaringan. Nilai aktual dapat berubah sebelum konfirmasi.</HelpTip></p>
  </section>;
}
