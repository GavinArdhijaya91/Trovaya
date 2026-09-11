from __future__ import annotations

import base64
import hashlib
import os
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .models import PoisonResponse, WatermarkResponse
from .perturbation import InvalidImageError, perturb_image
from .rate_limit import RateLimitMiddleware
from .watermark import watermark_identity_document

MAX_UPLOAD_BYTES = 15 * 1024 * 1024

app = FastAPI(
    title="Trovaya Poison Engine",
    version="0.1.0",
    description="Simulation-only adversarial image perturbation service.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("TROVAYA_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, requests_per_minute=10)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/poison", response_model=PoisonResponse, tags=["protection"])
async def poison_image(
    file: Annotated[UploadFile, File()],
    intensity: Annotated[float, Form(ge=0.0, le=1.0)] = 0.80,
) -> PoisonResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "file must be an image")

    source = await file.read(MAX_UPLOAD_BYTES + 1)
    if not source:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "image is empty")
    if len(source) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "image exceeds 15 MB")

    try:
        poisoned = perturb_image(source, intensity)
    except (InvalidImageError, ValueError) as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc

    digest = hashlib.sha256(poisoned).hexdigest()
    encoded = base64.b64encode(poisoned).decode("ascii")
    return PoisonResponse(
        poisoned_image_base64=f"data:image/png;base64,{encoded}",
        perturbation_hash=f"0x{digest}",
        capability_notice=(
            "Experimental bounded pixel transform; no adversarial-protection effectiveness "
            "is claimed. This response is not persisted to IPFS."
        ),
    )


@app.post("/api/v1/kyc/watermark", response_model=WatermarkResponse, tags=["privacy"])
async def watermark_kyc_document(file: Annotated[UploadFile, File()]) -> WatermarkResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "document must be an image")
    source = await file.read(MAX_UPLOAD_BYTES + 1)
    if not source:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "document is empty")
    if len(source) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "document exceeds 15 MB")
    try:
        watermarked = watermark_identity_document(source)
    except InvalidImageError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    encoded = base64.b64encode(watermarked).decode("ascii")
    return WatermarkResponse(
        watermarked_document_base64=f"data:image/jpeg;base64,{encoded}",
        privacy_notice="Dokumen diberi watermark SAMPLE / CONTOH dan tidak disimpan oleh layanan.",
    )
