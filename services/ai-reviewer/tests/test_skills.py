from app.models import AssetReviewRequest, LicenseEvidence
from app.reviewer import review_asset
from app.skills import select_skill


def test_protocol_signal_skill_selection():
    # AI Dataset Buyer skill when allow_ai_training is True and pinata persistence
    req1 = AssetReviewRequest(
        token_id="14",
        persistence_mode="pinata",
        license=LicenseEvidence(allow_ai_training=True, terms_hash_verified=True),
    )
    skill1 = select_skill(req1)
    assert skill1.id == "ai_dataset_buyer"
    res1 = review_asset(req1)
    assert res1.skill_applied == "AI Dataset Buyer Diligence"

    # Protected asset skill when allow_ai_training is False
    req2 = AssetReviewRequest(
        token_id="15",
        persistence_mode="pinata",
        license=LicenseEvidence(allow_ai_training=False, terms_hash_verified=True),
    )
    skill2 = select_skill(req2)
    assert skill2.id == "ai_protected_asset"
    res2 = review_asset(req2)
    assert res2.skill_applied == "Protected Anti-Scraping Audit"

    # Unverified persistence skill when persistence is not pinata
    req3 = AssetReviewRequest(
        token_id="16",
        persistence_mode="demo",
    )
    skill3 = select_skill(req3)
    assert skill3.id == "unverified_persistence"
