import { NextRequest, NextResponse } from "next/server";
import { requestJson } from "@/lib/service-request";
import type { AssetReview, AssetReviewInput } from "@/lib/reviewer-types";

function parseGradioResult(stream: string): AssetReview {
  const completeEvent = stream.split(/\r?\n\r?\n/).reverse().find((event) => event.includes("event: complete"));
  const dataLine = completeEvent?.split(/\r?\n/).find((line) => line.startsWith("data:"));
  if (!dataLine) throw new Error("Reviewer tidak mengembalikan hasil.");
  const output = JSON.parse(dataLine.slice("data:".length).trim()) as unknown;
  const reviewJson = Array.isArray(output) ? output[0] : output;
  return typeof reviewJson === "string" ? JSON.parse(reviewJson) as AssetReview : reviewJson as AssetReview;
}

export async function POST(request: NextRequest) {
  const reviewerUrl = process.env.AI_REVIEWER_URL;
  if (!reviewerUrl) return NextResponse.json({ detail: "Audit informasi belum dikonfigurasi." }, { status: 503 });
  const body = await request.json().catch(() => null) as AssetReviewInput | null;
  if (!body || !/^[1-9]\d{0,77}$/.test(body.token_id)) {
    return NextResponse.json({ detail: "Data audit asset tidak valid." }, { status: 400 });
  }
  try {
    const baseUrl = reviewerUrl.replace(/\/$/, "");
    const job = await requestJson<{ event_id: string }>(`${baseUrl}/call/review_asset`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: [JSON.stringify(body)] }),
    }, { attempts: 1 });
    const resultResponse = await fetch(`${baseUrl}/call/review_asset/${encodeURIComponent(job.event_id)}`);
    if (!resultResponse.ok) throw new Error("Reviewer job gagal.");
    const result = parseGradioResult(await resultResponse.text());
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ detail: "Audit informasi belum dapat dijalankan." }, { status: 503 });
  }
}
