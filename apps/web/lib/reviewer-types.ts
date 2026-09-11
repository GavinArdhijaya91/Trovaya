export type ReviewSeverity = "info" | "warning" | "critical";

export interface ReviewerFlag {
  code: string;
  severity: ReviewSeverity;
  message: string;
}
export interface AssetReviewInput {
  token_id: string;
  metadata_hash_verified?: boolean;
  persistence_mode: "pinata" | "demo" | "unknown";
  public_preview_cid: boolean;
  encrypted_vault_cid: boolean;
  license_terms_cid: boolean;
  preview_protection: "experimental" | "verified" | "unknown";
  creator_identity: "verified" | "not_verified" | "unknown";
  quality_policy_version?: number;
  original_resolution?: { width: number; height: number };
  original_size_bytes?: number;
  original_extension?: "png" | "jpg" | "webp";
  license: {
    terms_hash_verified?: boolean;
    duration_days?: number;
    territory?: string;
    permitted_use?: string;
    allow_ai_training?: boolean;
  };
  gallery_category?: string;
}

export interface AssetReview extends AssetReviewInput {
  summary: string;
  evidence: string[];
  flags: ReviewerFlag[];
  source: string;
  ai_available: boolean;
  skill_applied?: string;
  confidence_note?: string;
  disclaimer: string;
}
