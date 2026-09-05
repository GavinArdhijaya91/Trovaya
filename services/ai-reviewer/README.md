---
title: Trovaya AI Reviewer
emoji: shield
colorFrom: green
colorTo: yellow
sdk: gradio
sdk_version: 5.50.0
app_file: app.py
app_port: 7860
pinned: false
---

# Trovaya AI Reviewer

Rules-first, non-advisory asset evidence reviewer. The Gradio Space exposes a
browser test UI and the `review_asset` Gradio API:

- `POST /gradio_api/call/review_asset`
- `GET /gradio_api/call/review_asset/{event_id}`

The Trovaya web application proxies this API and sends public asset evidence
only.

## Deploy to Hugging Face Spaces

Create a Gradio Space and copy the contents of this directory into it. The
Space URL is the value for `AI_REVIEWER_URL` in the web application's server
environment, for example:

```text
AI_REVIEWER_URL=https://<org>-<space>.hf.space
```

Verify the deployment from the Space UI or its Gradio API before connecting the
web app:

```text
POST https://<org>-<space>.hf.space/gradio_api/call/review_asset
```

Set the Space secrets/variables for cloud mode:

```text
AI_REVIEWER_PROVIDER=openai_compatible
CLOUD_LLM_URL=https://openrouter.ai/api/v1
CLOUD_LLM_API_KEY=<secret>
CLOUD_LLM_MODEL=<available free OpenRouter model>
AI_REVIEWER_TIMEOUT_SECONDS=8
```

The deterministic rules engine remains authoritative. If the cloud LLM is
unavailable, the service returns a rules-only summary.
