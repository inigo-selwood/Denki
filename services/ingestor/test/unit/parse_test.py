from fastapi.testclient import TestClient

from source import services
from source.main import run


def test_parse_returns_html(monkeypatch) -> None:
    """Verify the parse endpoint returns HTML."""
    app = run()
    client = TestClient(app)
    monkeypatch.setattr(
        services,
        "parse",
        lambda content, mime_type: "<html><body></body></html>\n",
    )

    response = client.post(
        "/parse",
        files={"file": ("screen.png", b"not-used-by-fake", "image/png")},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.text == "<html><body></body></html>\n"


def test_parse_rejects_unsupported_media_type() -> None:
    """Verify unsupported uploads are rejected."""
    app = run()
    client = TestClient(app)

    response = client.post(
        "/parse",
        files={"file": ("notes.txt", b"text", "text/plain")},
    )

    assert response.status_code == 415


def test_parse_rejects_missing_file() -> None:
    """Verify requests without a file are rejected."""
    app = run()
    client = TestClient(app)

    response = client.post("/parse")

    assert response.status_code == 422
