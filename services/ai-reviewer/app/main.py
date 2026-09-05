from fastapi import FastAPI

from .models import AssetReviewRequest, ReviewResponse
from .reviewer import review_asset

app = FastAPI(
    title="Trovaya AI Reviewer",
    version="0.1.0",
    description="Rules-first, non-advisory asset evidence reviewer with optional local AI.",
)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/reviews/assets", response_model=ReviewResponse, tags=["reviews"])
def review(request: AssetReviewRequest) -> ReviewResponse:
    return review_asset(request)
