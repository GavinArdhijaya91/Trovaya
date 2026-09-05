from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_review_falls_back_without_ollama():
    response = client.post("/api/v1/reviews/assets", json={"token_id": "12", "preview_protection": "experimental"})
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "rules"
    assert body["ai_available"] is False
    assert body["disclaimer"]
    assert any(flag["code"] == "EXPERIMENTAL_PROTECTION" for flag in body["flags"])
