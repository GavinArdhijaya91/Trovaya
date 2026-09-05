from __future__ import annotations

import json
import os

import gradio as gr
import spaces
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.models import AssetReviewRequest
from app.reviewer import review_asset


api = FastAPI(title="Trovaya AI Reviewer", version="0.1.0")
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@api.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@api.post("/api/v1/reviews/assets")
def review_asset_endpoint(payload: dict) -> JSONResponse:
    try:
        review = review_asset(AssetReviewRequest.model_validate(payload))
        return JSONResponse(review.model_dump())
    except Exception as error:
        return JSONResponse({"detail": f"Review payload tidak valid: {error}"}, status_code=422)


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

app = gr.mount_gradio_app(api, demo, path="/")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
