from .cloud_llm import summarize_cloud
from .models import AssetReviewRequest, ReviewResponse
from .ollama import summarize_local
from .rules import rules_review


def review_asset(request: AssetReviewRequest) -> ReviewResponse:
    evidence, flags = rules_review(request)
    ai_summary = summarize_local(evidence, flags) or summarize_cloud(evidence, flags)
    fallback = build_fallback_summary(request, evidence, flags)
    return ReviewResponse(
        token_id=request.token_id,
        summary=ai_summary or fallback,
        evidence=evidence,
        flags=flags,
        source="rules+ai" if ai_summary else "rules",
        ai_available=ai_summary is not None,
    )


def build_fallback_summary(request: AssetReviewRequest, evidence: list[str], flags: list) -> str:
    if not evidence:
        return "Belum tersedia cukup evidence terstruktur untuk membuat ringkasan asset."
    if request.license.duration_days:
        return f"Evidence mencatat lisensi dengan durasi {request.license.duration_days} hari; beberapa status masih perlu diperiksa dari flags."
    return f"Tersedia {len(evidence)} item evidence; periksa flags sebelum membuat keputusan sendiri."
