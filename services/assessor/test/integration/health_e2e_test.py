import pytest
from fastapi.testclient import TestClient

from source.main import run


@pytest.mark.integration
def test_health_endpoint_is_available() -> None:
    """Verify the running application exposes its health endpoint."""
    app = run()
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
