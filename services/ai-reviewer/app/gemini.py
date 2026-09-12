from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import TYPE_CHECKING

from .config import settings
from .models import ReviewFlag

if TYPE_CHECKING:
    from .skills import SkillDefinition

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

SYSTEM_PROMPT = """You are an independent, non-advisory Web3 asset audit reviewer for Trovaya Protocol.
Summarize strictly based on the provided evidence, security flags, and the applied audit skill.
Language: Indonesian (Bahasa Indonesia).
Tone: Objective, informative, fintech/compliance-grade.
Strict Constraints:
- NEVER advise buying, selling, investing, or claiming legal authenticity or absolute scraping immunity.
- Keep the summary under 280 characters.
- Return ONLY valid JSON formatted as: {"summary": "...", "confidence_note": "..."}
"""


def summarize_gemini(
    evidence: list[str],
    flags: list[ReviewFlag],
    skill: SkillDefinition | None = None,
) -> tuple[str, str] | None:
    """Calls Google Gemini API to generate a structured non-advisory summary with skill guidance.

    Returns (summary, confidence_note) or None if unavailable/fails.
    """
    if not settings.gemini_api_key:
        return None

    model_name = settings.gemini_model or "gemini-1.5-flash-8b"
    url = f"{GEMINI_BASE_URL}/{model_name}:generateContent?key={settings.gemini_api_key}"

    skill_context = ""
    if skill:
        skill_context = f"\nApplied Skill: {skill.title}\n{skill.system_prompt_extra}\n"

    user_payload = {
        "applied_skill": skill.title if skill else "Standard",
        "evidence": evidence,
        "flags": [flag.model_dump() for flag in flags],
    }

    full_prompt = f"{SYSTEM_PROMPT}\n{skill_context}\nInput Data:\n{json.dumps(user_payload, ensure_ascii=False)}"

    body = {
        "contents": [
            {
                "parts": [
                    {"text": full_prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
            "maxOutputTokens": 300,
        },
    }

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=settings.timeout_seconds) as response:
            res_data = json.loads(response.read().decode("utf-8"))

        candidates = res_data.get("candidates", [])
        if not candidates:
            return None

        content_parts = candidates[0].get("content", {}).get("parts", [])
        if not content_parts:
            return None

        raw_text = content_parts[0].get("text", "").strip()
        parsed = json.loads(raw_text)

        summary = parsed.get("summary")
        confidence_note = parsed.get("confidence_note", "")

        if isinstance(summary, str) and 1 <= len(summary) <= 320:
            return summary, confidence_note
        elif isinstance(summary, str) and len(summary) > 320:
            return summary[:280] + "…", confidence_note
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError, urllib.error.URLError):
        return None

    return None
