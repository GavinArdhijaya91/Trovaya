from typing import Literal

from pydantic import BaseModel, Field


class Resolution(BaseModel):
    width: int = Field(ge=1, le=8192)
    height: int = Field(ge=1, le=8192)


class LicenseEvidence(BaseModel):
    terms_hash_verified: bool | None = None
    duration_days: int | None = Field(default=None, ge=1, le=3650)
    territory: str | None = Field(default=None, max_length=100)
    permitted_use: str | None = Field(default=None, max_length=500)
    allow_ai_training: bool | None = None


class AssetReviewRequest(BaseModel):
    token_id: str = Field(pattern=r"^[1-9]\d{0,77}$")
    metadata_hash_verified: bool | None = None
    persistence_mode: Literal["pinata", "demo", "unknown"] = "unknown"
    public_preview_cid: bool = False
    encrypted_vault_cid: bool = False
    license_terms_cid: bool = False
    preview_protection: Literal["experimental", "verified", "unknown"] = "unknown"
    creator_identity: Literal["verified", "not_verified", "unknown"] = "unknown"
    quality_policy_version: int | None = Field(default=None, ge=1, le=100)
    original_resolution: Resolution | None = None
    original_size_bytes: int | None = Field(default=None, ge=0, le=15 * 1024 * 1024)
    original_extension: Literal["png", "jpg", "webp"] | None = None
    license: LicenseEvidence = Field(default_factory=LicenseEvidence)


class ReviewFlag(BaseModel):
    code: str
    severity: Literal["info", "warning", "critical"]
    message: str


class ReviewResponse(BaseModel):
    token_id: str
    summary: str
    evidence: list[str]
    flags: list[ReviewFlag]
    source: Literal["rules", "rules+ai"]
    ai_available: bool
    disclaimer: str = "Informasi edukatif, bukan rekomendasi pembelian atau nasihat finansial/hukum."
