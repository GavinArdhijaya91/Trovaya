import json
import urllib.error
import urllib.request

from .config import settings
from .models import ReviewFlag

SYSTEM_PROMPT = """You are a non-advisory asset information formatter. Summarize only the supplied evidence and flags in Indonesian. Never recommend buying, selling, trusting, or claiming authenticity, copyright validity, legal safety, or scraping prevention. Return only JSON with a summary string under 280 characters."""


def summarize_cloud(evidence: list[str], flags: list[ReviewFlag]) -> str | None:
    if settings.provider != "openai_compatible" or not settings.cloud_url or not settings.cloud_api_key or not settings.cloud_model:
        return None
    payload = json.dumps({
        "model": settings.cloud_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps({"evidence": evidence, "flags": [flag.model_dump() for flag in flags]}, ensure_ascii=False)},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }).encode()
    try:
        request = urllib.request.Request(
            f"{settings.cloud_url}/chat/completions",
            data=payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {settings.cloud_api_key}"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=settings.timeout_seconds) as response:
            parsed = json.loads(response.read())
        content = parsed["choices"][0]["message"]["content"]
        summary = json.loads(content).get("summary")
        if isinstance(summary, str) and 1 <= len(summary) <= 280:
            return summary
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError, urllib.error.URLError):
        return None
    return None