from .cloud_llm import summarize_cloud
from .config import settings
from .gemini import summarize_gemini
from .models import AssetReviewRequest, ReviewResponse
from .ollama import summarize_local
from .rules import rules_review
from .skills import SkillDefinition, select_skill


def review_asset(request: AssetReviewRequest) -> ReviewResponse:
    skill = select_skill(request, settings.skills_dir)
    evidence, flags = rules_review(request, skill)

    ai_summary: str | None = None
    confidence_note: str | None = None
    source = "rules"

    # Priority 1: Google Gemini (if key configured or provider is gemini)
    if settings.gemini_api_key or settings.provider == "gemini":
        gemini_result = summarize_gemini(evidence, flags, skill)
        if gemini_result:
            ai_summary, confidence_note = gemini_result
            source = "rules+gemini"

    # Priority 2: OpenAI-compatible cloud LLM
    if not ai_summary and (settings.cloud_api_key or settings.provider == "openai_compatible"):
        cloud_result = summarize_cloud(evidence, flags)
        if cloud_result:
            ai_summary = cloud_result
            confidence_note = "Ringkasan dihasilkan melalui Cloud LLM audit."
            source = "rules+cloud"

    # Priority 3: Local Ollama
    if not ai_summary and settings.provider == "ollama":
        local_result = summarize_local(evidence, flags)
        if local_result:
            ai_summary = local_result
            confidence_note = "Ringkasan di-inferensikan melalui model lokal Ollama."
            source = "rules+ollama"

    # Fallback: Deterministic rule-based summary
    if not ai_summary:
        ai_summary = build_fallback_summary(request, evidence, flags, skill)
        confidence_note = f"Evaluasi deterministik dengan skill: {skill.title}."
        source = "rules"

    return ReviewResponse(
        token_id=request.token_id,
        summary=ai_summary,
        evidence=evidence,
        flags=flags,
        source=source,
        ai_available=source != "rules",
        skill_applied=skill.title,
        confidence_note=confidence_note,
    )


def build_fallback_summary(
    request: AssetReviewRequest,
    evidence: list[str],
    flags: list,
    skill: SkillDefinition,
) -> str:
    if not evidence:
        return f"[{skill.title}] Belum tersedia cukup evidence terstruktur untuk audit asset #{request.token_id}."
    
    warning_count = sum(1 for f in flags if getattr(f, "severity", "") in ("warning", "critical"))
    
    if request.license.duration_days:
        base = f"[{skill.title}] Evidence mencatat lisensi {request.license.duration_days} hari dengan {len(evidence)} verifikasi."
    else:
        base = f"[{skill.title}] Terverifikasi {len(evidence)} parameter on-chain & storage."

    if warning_count > 0:
        return f"{base} Terdapat {warning_count} catatan yang perlu diverifikasi mandiri."
    return f"{base} Semua sinyal utama dalam kondisi valid."
