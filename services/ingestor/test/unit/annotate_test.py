from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from source import services
from source.main import run


def test_annotate_renders_markup_bounds_as_png() -> None:
    """Verify markup bounds render as colored boxes on the source image."""
    image_content = BytesIO()
    Image.new("RGB", (64, 64), "white").save(image_content, format="PNG")

    output = services.annotate(
        content=image_content.getvalue(),
        markup=(
            '<html><body><p bounds="10,10,20,20" '
            'source-label="text">Total</p></body></html>\n'
        ),
    )

    with Image.open(BytesIO(output)) as image:
        assert image.format == "PNG"
        assert image.size == (64, 64)
        assert image.convert("RGB").getpixel((10, 10)) != (255, 255, 255)


def test_annotate_endpoint_returns_png(monkeypatch) -> None:
    """Verify the annotate endpoint returns image bytes."""
    app = run()
    client = TestClient(app)
    monkeypatch.setattr(
        services,
        "annotate",
        lambda content, markup: b"png-content",
    )

    response = client.post(
        "/annotate",
        files={"file": ("screen.png", b"image-content", "image/png")},
        data={"markup": "<html><body></body></html>\n"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/png")
    assert response.content == b"png-content"


def test_annotate_endpoint_rejects_unsupported_media_type() -> None:
    """Verify unsupported uploads are rejected."""
    app = run()
    client = TestClient(app)

    response = client.post(
        "/annotate",
        files={"file": ("notes.txt", b"text", "text/plain")},
        data={"markup": "<html><body></body></html>\n"},
    )

    assert response.status_code == 415
