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

  const getSourceLabel = (src: string) => {
    if (src.includes("gemini")) return "Google Gemini + Rules Protocol";
    if (src.includes("cloud")) return "Cloud LLM + Rules Protocol";
    if (src.includes("ollama")) return "Ollama Local + Rules Protocol";
    if (src === "rules+ai") return "Rules + AI Reviewer";
    return "Deterministic Protocol Rules";
  };

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-xs font-bold text-leaf">
              🛡️
            </span>
            <p className="text-xs font-bold tracking-tight text-ink">AI & Protocol Evidence Reviewer</p>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-800">
              Non-advisory
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Audit independen integritas on-chain, terms lisensi, dan proteksi preview.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void inspect()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-leaf px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#063d33] disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Menganalisis…
            </span>
          ) : review ? (
            "Perbarui Audit"
          ) : (
            "Jalankan Audit AI"
          )}
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-xl bg-amber-50/80 p-3 text-xs leading-5 text-amber-800 border border-amber-200">
          {error}
        </div>
      )}

      {review && (
        <div className="mt-4 space-y-3.5 border-t border-stone-100 pt-3 text-xs leading-relaxed text-stone-700">
          {review.skill_applied && (
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-700 border border-stone-200">
                Applied Audit Skill: <span className="text-leaf">{review.skill_applied}</span>
              </span>
              {review.ai_available && (
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  ✨ LLM Enhanced
                </span>
              )}
            </div>
          )}

          <div className="rounded-xl bg-sand/60 p-3 border border-stone-200/80">
            <p className="font-medium text-ink">{review.summary}</p>
            {review.confidence_note && (
              <p className="mt-1.5 text-[11px] text-stone-500 italic">
                {review.confidence_note}
              </p>
            )}
          </div>

          {review.evidence.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-leaf">
                Verified On-Chain & Storage Evidence
              </p>
              <ul className="mt-1.5 space-y-1 pl-4 list-disc text-[11px] text-stone-600">
                {review.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {review.flags.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Perhatian Calon Pembeli / Lisensi
              </p>
              <ul className="mt-1.5 space-y-1 pl-4 list-disc text-[11px] text-stone-600">
                {review.flags.map((flag) => (
                  <li key={flag.code}>
                    <span className={flag.severity === "critical" ? "font-bold text-red-600" : flag.severity === "warning" ? "font-medium text-amber-700" : "text-stone-600"}>
                      {flag.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-stone-100 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-400">
            <span>{review.disclaimer}</span>
            <span className="font-medium text-stone-500">
              Provider: {getSourceLabel(review.source)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

