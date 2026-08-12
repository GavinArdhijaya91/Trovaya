from typing import Literal

from pydantic import BaseModel


class PoisonResponse(BaseModel):
    status: Literal["success"] = "success"
    poisoned_image_base64: str
    perturbation_hash: str
    public_ipfs_cid: str


class WatermarkResponse(BaseModel):
    status: Literal["success"] = "success"
    watermarked_document_base64: str
    privacy_notice: str
