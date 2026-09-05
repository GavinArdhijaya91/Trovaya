from __future__ import annotations

import json

import gradio as gr
import spaces

from app.models import AssetReviewRequest
from app.reviewer import review_asset


@spaces.GPU
def review_json(payload: str) -> str:
    try:
        parsed = json.loads(payload)
        review = review_asset(AssetReviewRequest.model_validate(parsed))
        return json.dumps(review.model_dump(), ensure_ascii=False, indent=2)
    except (json.JSONDecodeError, TypeError, ValueError) as error:
        return json.dumps({"detail": f"Input JSON tidak valid: {error}"}, ensure_ascii=False, indent=2)


demo = gr.Interface(
    fn=review_json,
    inputs=gr.Code(
        value=json.dumps({"token_id": "12", "preview_protection": "experimental"}, indent=2),
        language="json",
        label="Public asset evidence JSON",
    ),
    outputs=gr.Code(language="json", label="Non-advisory review"),
    title="Trovaya AI Reviewer",
    description="Rules-first asset evidence summary. Informasi edukatif, bukan rekomendasi pembelian atau nasihat hukum.",
    api_name="review_asset",
)

if __name__ == "__main__":
    demo.queue().launch(server_name="0.0.0.0", server_port=7860)
