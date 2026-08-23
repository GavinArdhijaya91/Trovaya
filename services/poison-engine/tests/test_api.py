import base64
from io import BytesIO
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image, ImageFont

from app.main import app
from app.watermark import watermark_identity_document

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
    assert body["protection_mode"] == "experimental"
    assert body["persistence_status"] == "not_persisted"
    assert "no adversarial-protection effectiveness is claimed" in body["capability_notice"]
    assert "public_ipfs_cid" not in body


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
    assert body["identity_mode"] == "mock"
    assert body["verification_status"] == "not_verified"
    assert body["watermarked_document_base64"].startswith("data:image/jpeg;base64,")
    assert "tidak disimpan" in body["privacy_notice"]


def test_watermark_falls_back_without_scalable_embedded_font() -> None:
    bitmap_font = ImageFont.load_default()
    with patch(
        "app.watermark.ImageFont.load_default",
        side_effect=[OSError("scalable font unavailable"), bitmap_font],
    ) as load_default:
        result = watermark_identity_document(image_bytes())

    assert result.startswith(b"\xff\xd8")
    assert load_default.call_count == 2
