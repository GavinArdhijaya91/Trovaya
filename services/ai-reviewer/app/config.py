import os


class Settings:
    provider = os.getenv("AI_REVIEWER_PROVIDER", "ollama").lower()
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
    ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    cloud_url = os.getenv("CLOUD_LLM_URL", "").rstrip("/")
    cloud_api_key = os.getenv("CLOUD_LLM_API_KEY", "")
    cloud_model = os.getenv("CLOUD_LLM_MODEL", "").strip()
    ollama_timeout_seconds = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "8"))
    timeout_seconds = float(os.getenv("AI_REVIEWER_TIMEOUT_SECONDS", str(ollama_timeout_seconds)))


settings = Settings()
