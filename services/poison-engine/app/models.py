from typing import Literal

from pydantic import BaseModel


class PoisonResponse(BaseModel):
    status: Literal["success"] = "success"
    protection_mode: Literal["experimental"] = "experimental"
    persistence_status: Literal["not_persisted"] = "not_persisted"
    poisoned_image_base64: str
    perturbation_hash: str
    capability_notice: str


class WatermarkResponse(BaseModel):
    status: Literal["success"] = "success"
    identity_mode: Literal["mock"] = "mock"
    verification_status: Literal["not_verified"] = "not_verified"
    watermarked_document_base64: str
    privacy_notice: str
