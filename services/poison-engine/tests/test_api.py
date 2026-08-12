import base64
from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def image_bytes() -> bytes:
    output = BytesIO()
    Image.new("RGB", (3, 3), (100, 120, 140)).save(output, "PNG")
    return output.getvalue()


def test_poison_contract() -> None:
    response = client.post(
        "/api/v1/poison",
        files={"file": ("asset.png", image_bytes(), "image/png")},
        data={"intensity": "0.5"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["poisoned_image_base64"].startswith("data:image/png;base64,")
    assert len(base64.b64decode(body["poisoned_image_base64"].split(",", 1)[1])) > 0
    assert body["perturbation_hash"].startswith("0x")
    assert body["public_ipfs_cid"].startswith("Qm")


def test_rejects_non_image() -> None:
    response = client.post(
        "/api/v1/poison",
        files={"file": ("asset.txt", b"not an image", "text/plain")},
        data={"intensity": "0.5"},
    )
    assert response.status_code == 415


def test_watermarks_kyc_document_in_memory() -> None:
    response = client.post(
        "/api/v1/kyc/watermark",
        files={"file": ("identity.png", image_bytes(), "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["watermarked_document_base64"].startswith("data:image/jpeg;base64,")
    assert "tidak disimpan" in body["privacy_notice"]
