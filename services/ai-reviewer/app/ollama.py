import json
import urllib.error
import urllib.request

from .config import settings
from .models import ReviewFlag


SYSTEM_PROMPT = """You are a non-advisory asset information formatter. Summarize only the supplied evidence and flags in Indonesian. Never recommend buying, selling, trusting, or claiming authenticity, copyright validity, legal safety, or scraping prevention. Return only JSON: {\\"summary\\": string}. Keep it under 280 characters."""


def summarize_local(evidence: list[str], flags: list[ReviewFlag]) -> str | None:
    if settings.provider != "ollama":
        return None
    prompt = json.dumps({"evidence": evidence, "flags": [flag.model_dump() for flag in flags]}, ensure_ascii=False)
    payload = json.dumps({"model": settings.ollama_model, "system": SYSTEM_PROMPT, "prompt": prompt, "stream": False, "format": "json"}).encode()
    try:
        request_obj = urllib.request.Request(
            f"{settings.ollama_url}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request_obj, timeout=settings.ollama_timeout_seconds) as response:
            parsed = json.loads(response.read())
        result = json.loads(parsed.get("response", "{}"))
        summary = result.get("summary")
        if isinstance(summary, str) and 1 <= len(summary) <= 280:
            return summary
    except (OSError, ValueError, KeyError, json.JSONDecodeError, urllib.error.URLError):
        return None
    return None
