import os


class Settings:
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-8b").strip()
    skills_dir = os.getenv("AI_REVIEWER_GALLERY_RULES_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "skills"))

    _default_provider = "gemini" if gemini_api_key else ("openai_compatible" if os.getenv("CLOUD_LLM_API_KEY") else "rules")
    provider = os.getenv("AI_REVIEWER_PROVIDER", _default_provider).lower()

    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
    ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    cloud_url = os.getenv("CLOUD_LLM_URL", "").rstrip("/")
    cloud_api_key = os.getenv("CLOUD_LLM_API_KEY", "")
    cloud_model = os.getenv("CLOUD_LLM_MODEL", "").strip()
    ollama_timeout_seconds = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "8"))
    timeout_seconds = float(os.getenv("AI_REVIEWER_TIMEOUT_SECONDS", str(ollama_timeout_seconds)))


settings = Settings()
