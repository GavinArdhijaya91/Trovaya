from app.models import AssetReviewRequest, LicenseEvidence
from app.rules import build_evidence, build_flags


def test_rules_are_factual_and_non_advisory():
    request = AssetReviewRequest(
        token_id="12",
        metadata_hash_verified=True,
        persistence_mode="pinata",
        public_preview_cid=True,
        encrypted_vault_cid=True,
        license_terms_cid=True,
        preview_protection="experimental",
        creator_identity="not_verified",
        license=LicenseEvidence(duration_days=365, terms_hash_verified=True, allow_ai_training=False),
    )
    evidence = build_evidence(request)
    flags = build_flags(request)
    assert "Hash metadata cocok" in evidence[0]
    assert {flag.code for flag in flags} == {"EXPERIMENTAL_PROTECTION", "IDENTITY_NOT_VERIFIED", "AI_TRAINING_NOT_ALLOWED"}
    assert all("beli" not in flag.message.lower() for flag in flags)


def test_unverified_input_fails_closed():
    flags = build_flags(AssetReviewRequest(token_id="1"))
    assert {flag.code for flag in flags} == {
        "UNKNOWN_PROTECTION",
        "IDENTITY_NOT_VERIFIED",
        "PERSISTENCE_UNCONFIRMED",
        "METADATA_HASH_UNVERIFIED",
        "LICENSE_TERMS_UNVERIFIED",
    }
