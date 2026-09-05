# AI Reviewer Cloud Deployment

The AI Reviewer can run on Hugging Face Spaces with OpenRouter as its cloud LLM. The rules
engine remains authoritative; a provider failure falls back to a rules-only
summary.

## Hugging Face Gradio Space

Create a new **Gradio Space**. Copy the contents of:

```text
services/ai-reviewer
```

into the Space repository. The included `README.md` declares the Gradio SDK
and port `7860`. Gradio exposes the `review_asset` API through:

```text
/call/review_asset
```

Set these Space variables/secrets:

```text
AI_REVIEWER_PROVIDER=openai_compatible
CLOUD_LLM_URL=https://openrouter.ai/api/v1
CLOUD_LLM_API_KEY=<Space secret>
CLOUD_LLM_MODEL=<an available OpenRouter :free model>
AI_REVIEWER_TIMEOUT_SECONDS=8
```

Do not use `NEXT_PUBLIC_` for the API key. Do not commit the key to `.env`
files or source control.

After the Space is running, copy its public URL and set it in the
production web server environment:

```text
AI_REVIEWER_URL=https://<user>-<space>.hf.space
```

The web application calls its server-side `/api/reviewer` proxy, so the
browser never receives the Railway or OpenRouter secret.

## Local mode remains available

```text
AI_REVIEWER_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

If the cloud provider is unavailable, the reviewer returns the deterministic
rules-only response instead of blocking the asset gallery.

The Space may sleep when unused, so the first request can be slower. This is
acceptable for the optional reviewer path and does not block the core asset
registration flow.