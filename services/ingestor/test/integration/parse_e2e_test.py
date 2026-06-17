import os
from importlib.util import find_spec
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from source.main import run

RESOURCES = Path(__file__).parents[1] / "resources"
IMAGE_PATHS = sorted((RESOURCES / "images").glob("*.png"))


@pytest.mark.integration
@pytest.mark.skipif(
    os.environ.get("RUN_INGESTOR_INTEGRATION") != "1",
    reason="set RUN_INGESTOR_INTEGRATION=1 to run PaddleOCR integration tests",
)
def test_parse_extracts_html_from_doclaynet_financial_report() -> None:
    """Verify the real parse endpoint handles a fixture document image."""
    assert IMAGE_PATHS, "expected at least one fixture image"
    if find_spec("paddleocr") is None:
        pytest.fail("paddleocr is not installed; run task ingestor:setup")

    app = run()
    client = TestClient(app)
    image_path = IMAGE_PATHS[0]

    response = client.post(
        "/parse",
        files={
            "file": (
                image_path.name,
                image_path.read_bytes(),
                "image/png",
            )
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.text.startswith("<html><body>")
    assert response.text.endswith("</body></html>\n")
    assert 'source-label="' in response.text
