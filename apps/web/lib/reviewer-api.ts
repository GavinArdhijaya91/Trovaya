import { requestJson } from "@/lib/service-request";
import type { AssetReview, AssetReviewInput } from "@/lib/reviewer-types";

export async function requestAssetReview(input: AssetReviewInput): Promise<AssetReview> {
  return requestJson<AssetReview>("/api/reviewer/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  }, { attempts: 2 });
}
