export const PUBLIC_ASSET_FIELDS = [
  "id",
  "chain_id",
  "token_id",
  "creator_wallet",
  "allow_ai_training",
  "public_poisoned_cid",
  "commercial_license_fee_wei",
  "token_uri",
  "license_terms_uri",
  "license_terms_hash",
  "license_terms_version",
  "license_duration_seconds",
  "status",
  "created_at",
] as const;

export interface PublicAsset {
  id: string;
  chain_id: number;
  token_id: string;
  creator_wallet: string;
  allow_ai_training: boolean;
  public_poisoned_cid: string | null;
  commercial_license_fee_wei: string | null;
  token_uri: string | null;
  license_terms_uri: string | null;
  license_terms_hash: string | null;
  license_terms_version: number | null;
  license_duration_seconds: string | null;
  status: string;
  created_at: string;
}

export function parsePublicAssets(input: unknown): PublicAsset[] {
  if (!Array.isArray(input)) throw new Error("Public asset response must be an array.");
  return input.map(parsePublicAsset);
}

function parsePublicAsset(input: unknown): PublicAsset {
  if (!isRecord(input)) throw new Error("Public asset must be an object.");
  return {
    id: requiredString(input, "id"),
    chain_id: requiredNumber(input, "chain_id"),
    token_id: requiredString(input, "token_id"),
    creator_wallet: requiredString(input, "creator_wallet"),
    allow_ai_training: requiredBoolean(input, "allow_ai_training"),
    public_poisoned_cid: nullableString(input, "public_poisoned_cid"),
    commercial_license_fee_wei: nullableString(input, "commercial_license_fee_wei"),
    token_uri: nullableString(input, "token_uri"),
    license_terms_uri: nullableString(input, "license_terms_uri"),
    license_terms_hash: nullableString(input, "license_terms_hash"),
    license_terms_version: nullableNumber(input, "license_terms_version"),
    license_duration_seconds: nullableString(input, "license_duration_seconds"),
    status: requiredString(input, "status"),
    created_at: requiredString(input, "created_at"),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  if (typeof value !== "string") throw new Error(`Public asset field ${field} must be a string.`);
  return value;
}

function requiredNumber(record: Record<string, unknown>, field: string): number {
  const value = record[field];
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`Public asset field ${field} must be a safe integer.`);
  }
  return value;
}

function requiredBoolean(record: Record<string, unknown>, field: string): boolean {
  const value = record[field];
  if (typeof value !== "boolean") throw new Error(`Public asset field ${field} must be a boolean.`);
  return value;
}

function nullableString(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  if (value !== null && typeof value !== "string") {
    throw new Error(`Public asset field ${field} must be a string or null.`);
  }
  return value;
}

function nullableNumber(record: Record<string, unknown>, field: string): number | null {
  const value = record[field];
  if (value !== null && (typeof value !== "number" || !Number.isSafeInteger(value))) {
    throw new Error(`Public asset field ${field} must be a safe integer or null.`);
  }
  return value;
}
