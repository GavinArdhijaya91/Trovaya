"use client";

import { useState } from "react";
import { HelpTip } from "./help-tip";
import { uiTerms } from "@/lib/terminology";

export function LicensePreview() {
  const [learning, setLearning] = useState(false);
  return <>
    <button type="button" onClick={() => setLearning(true)} className="rounded-xl bg-leaf px-4 py-2 text-sm font-semibold text-white">Belajar dulu sebelum beli</button>
    {learning && <div role="dialog" aria-modal="true" aria-labelledby="learn-title" className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft">
        <h2 id="learn-title" className="text-2xl font-semibold">Hak penggunaan komersial</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Pembelian memberi bukti lisensi komersial non-eksklusif untuk karya ini. Kepemilikan hak cipta dan token tidak otomatis berpindah.</p>
        <div className="mt-5 space-y-3 rounded-2xl bg-sand p-4 text-sm">
          <p className="flex justify-between"><span>Royalti kreator</span><strong>0.010 BNB</strong></p>
          <p className="flex justify-between"><span>{uiTerms.gasFee}<HelpTip>Dibayarkan ke jaringan untuk memproses pencatatan lisensi.</HelpTip></span><strong>Estimasi 0.00001 BNB</strong></p>
          <p className="flex justify-between border-t pt-3"><span>Sisa saldo akun</span><strong>Dihitung saat akun terhubung</strong></p>
        </div>
        <button type="button" onClick={() => setLearning(false)} className="mt-5 w-full rounded-xl bg-ink px-4 py-3 font-semibold text-white">Saya mengerti</button>
      </div>
    </div>}
  </>;
}
