import { NextRequest, NextResponse } from "next/server";
import { requestJson } from "@/lib/service-request";
import type { AssetReview, AssetReviewInput } from "@/lib/reviewer-types";

export async function POST(request: NextRequest) {
  const reviewerUrl = process.env.AI_REVIEWER_URL;
  if (!reviewerUrl) return NextResponse.json({ detail: "Audit informasi belum dikonfigurasi." }, { status: 503 });
  const body = await request.json().catch(() => null) as AssetReviewInput | null;
  if (!body || !/^[1-9]\d{0,77}$/.test(body.token_id)) {
    return NextResponse.json({ detail: "Data audit asset tidak valid." }, { status: 400 });
  }
  try {
    const result = await requestJson<AssetReview>(`${reviewerUrl.replace(/\/$/, "")}/api/v1/reviews/assets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }, { attempts: 2 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ detail: "Audit informasi belum dapat dijalankan." }, { status: 503 });
  }
}
