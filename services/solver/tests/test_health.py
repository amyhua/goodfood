from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["service"] == "solver"


def test_ready_ok() -> None:
    res = client.get("/ready")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_app_importable() -> None:
    import app.main as m

    assert m.app.title == "goodfood-solver"
