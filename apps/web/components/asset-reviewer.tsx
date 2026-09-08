"use client";

import { useState } from "react";
import { requestAssetReview } from "@/lib/reviewer-api";
import type { AssetReviewInput } from "@/lib/reviewer-types";

export function AssetReviewer({ input }: { input: AssetReviewInput }) {
  const [review, setReview] = useState<Awaited<ReturnType<typeof requestAssetReview>>>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function inspect() {
    setLoading(true);
    setError(undefined);
    try {
      setReview(await requestAssetReview(input));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Audit informasi belum tersedia.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-nusa-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-nusa-900">Audit informasi asset</p>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-800 tracking-wide">Edukatif, bukan saran finansial/hukum</span>
          </div>
          <p className="mt-0.5 text-[10px] text-nusa-500">Evidence dan red flag, bukan rekomendasi.</p>
        </div>
        <button type="button" onClick={() => void inspect()} disabled={loading} className="interactive-btn rounded-lg bg-teal-900 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-teal-700 disabled:opacity-50">
          {loading ? "Menganalisis…" : review ? "Perbarui audit" : "Lihat audit"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-[11px] text-amber-800">{error}</p>}
      {review && (
        <div className="mt-3 space-y-2 text-[11px] leading-5 text-nusa-700">
          <p>{review.summary}</p>
          {review.evidence.length > 0 && <div><p className="font-semibold text-teal-900">Evidence tersedia</p><ul className="list-disc pl-4">{review.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div>}
          {review.flags.length > 0 && <div><p className="font-semibold text-amber-800">Hal yang perlu diperhatikan</p><ul className="list-disc pl-4">{review.flags.map((flag) => <li key={flag.code}>{flag.message}</li>)}</ul></div>}
          <p className="border-t border-nusa-200 pt-2 text-[10px] text-nusa-500">{review.disclaimer} · Sumber: {review.source === "rules+ai" ? "rules + AI" : "rules engine"}</p>
        </div>
      )}
    </div>
  );
}
