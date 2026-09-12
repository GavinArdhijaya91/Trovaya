import { NextRequest, NextResponse } from "next/server";
import { requestJson } from "@/lib/service-request";
import type { AssetReview, AssetReviewInput, ReviewerFlag } from "@/lib/reviewer-types";

function parseGradioResult(stream: string): AssetReview {
  const completeEvent = stream.split(/\r?\n\r?\n/).reverse().find((event) => event.includes("event: complete"));
  const dataLine = completeEvent?.split(/\r?\n/).find((line) => line.startsWith("data:"));
  if (!dataLine) throw new Error("Reviewer tidak mengembalikan hasil.");
  const output = JSON.parse(dataLine.slice("data:".length).trim()) as unknown;
  const reviewJson = Array.isArray(output) ? output[0] : output;
  return typeof reviewJson === "string" ? JSON.parse(reviewJson) as AssetReview : reviewJson as AssetReview;
}

function computeLocalFallbackReview(body: AssetReviewInput): AssetReview {
  const evidence: string[] = [];
  const flags: ReviewerFlag[] = [];

  if (body.metadata_hash_verified) evidence.push("Hash metadata cocok dengan referensi terdaftar.");
  if (body.persistence_mode === "pinata") evidence.push("Asset memiliki mode persistensi Pinata IPFS.");
  if (body.public_preview_cid) evidence.push("Preview publik memiliki referensi konten terdesentralisasi.");
  if (body.encrypted_vault_cid) evidence.push("Original terenkripsi memiliki referensi vault.");
  if (body.license_terms_cid) evidence.push("Dokumen terms lisensi memiliki referensi konten.");
  if (body.license.terms_hash_verified) evidence.push("Hash terms lisensi cocok dengan catatan on-chain.");
  if (body.license.duration_days) evidence.push(`Durasi lisensi tercatat ${body.license.duration_days} hari.`);
  if (body.license.allow_ai_training !== undefined) {
    evidence.push(`Consent pelatihan AI: ${body.license.allow_ai_training ? "diizinkan" : "tidak diizinkan"}.`);
  }

  if (body.preview_protection === "experimental") {
    flags.push({ code: "EXPERIMENTAL_PROTECTION", severity: "info", message: "Protected preview masih eksperimental dan tidak membuktikan pencegahan scraping total." });
  }
  if (body.creator_identity !== "verified") {
    flags.push({ code: "IDENTITY_NOT_VERIFIED", severity: "warning", message: "Identitas creator belum diverifikasi oleh issuer independen." });
  }
  if (body.persistence_mode !== "pinata") {
    flags.push({ code: "PERSISTENCE_UNCONFIRMED", severity: "warning", message: "Persistensi asset belum dibuktikan sebagai pinning IPFS nyata." });
  }
  if (!body.license.terms_hash_verified) {
    flags.push({ code: "LICENSE_TERMS_UNVERIFIED", severity: "warning", message: "Hash terms lisensi belum diverifikasi." });
  }
  if (body.license.allow_ai_training === false) {
    flags.push({ code: "AI_TRAINING_NOT_ALLOWED", severity: "info", message: "Terms mencatat bahwa pelatihan AI tidak diizinkan." });
  }

  let skillApplied = "General Provenance Audit";
  if (body.persistence_mode !== "pinata") {
    skillApplied = "Decentralized Persistence Diligence";
  } else if (body.license.allow_ai_training === false) {
    skillApplied = "Protected Anti-Scraping Audit";
    evidence.push("Klausul proteksi AI training tercatat secara kriptografis.");
  } else if (body.license.allow_ai_training === true) {
    skillApplied = "AI Dataset Buyer Diligence";
    evidence.push("Izin pelatihan AI terkonfirmasi dalam terms lisensi.");
  }

  return {
    ...body,
    summary: `[${skillApplied}] Evidence mencatat ${evidence.length} verifikasi parameter on-chain & storage. Terdapat ${flags.length} catatan perhatian.`,
    evidence,
    flags,
    source: "rules",
    ai_available: false,
    skill_applied: skillApplied,
    confidence_note: "Audit dieksekusi melalui mesin verifikasi protokol terstandar.",
    disclaimer: "Informasi edukatif, bukan rekomendasi pembelian atau nasihat finansial/hukum.",
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as AssetReviewInput | null;
  if (!body || !/^[1-9]\d{0,77}$/.test(body.token_id)) {
    return NextResponse.json({ detail: "Data audit asset tidak valid." }, { status: 400 });
  }

  const reviewerUrl = process.env.AI_REVIEWER_URL;

  if (reviewerUrl) {
    const baseUrl = reviewerUrl.replace(/\/$/, "");

    // 1. Try FastAPI endpoint first
    try {
      const fastApiResponse = await fetch(`${baseUrl}/api/v1/reviews/assets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });
      if (fastApiResponse.ok) {
        const result = await fastApiResponse.json() as AssetReview;
        return NextResponse.json(result);
      }
    } catch {
      // Continue to Gradio attempt
    }

    // 2. Try Gradio endpoint
    try {
      const job = await requestJson<{ event_id: string }>(`${baseUrl}/gradio_api/call/review_asset`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: [JSON.stringify(body)] }),
      }, { attempts: 1 });
      const resultResponse = await fetch(`${baseUrl}/gradio_api/call/review_asset/${encodeURIComponent(job.event_id)}`);
      if (resultResponse.ok) {
        const result = parseGradioResult(await resultResponse.text());
        return NextResponse.json(result);
      }
    } catch {
      // Fallback to local deterministic rules
    }
  }

  // Graceful deterministic fallback ensures zero downtime
  return NextResponse.json(computeLocalFallbackReview(body));
}

