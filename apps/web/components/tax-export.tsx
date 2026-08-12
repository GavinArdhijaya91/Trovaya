"use client";

export interface TaxRow { purchasedAt: string; asset: string; cryptoAmount: string; fiatRateIdr: string; netRoyaltyIdr: string; }

export function TaxExport({ rows }: { rows: TaxRow[] }) {
  function download(): void {
    const header = ["Tanggal", "Aset", "Harga Crypto", "Kurs IDR", "Royalti Bersih IDR"];
    const csv = [header, ...rows.map((r) => [r.purchasedAt, r.asset, r.cryptoAmount, r.fiatRateIdr, r.netRoyaltyIdr])]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "trovaya-ringkasan-pajak.csv"; link.click(); URL.revokeObjectURL(url);
  }
  return <button type="button" onClick={download} disabled={!rows.length} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Unduh ringkasan pajak (CSV)</button>;
}
