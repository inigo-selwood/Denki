from fastapi.testclient import TestClient

from source.main import run


def test_health_returns_ok() -> None:
    """Verify the health endpoint returns the exact status payload."""
    app = run()
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
