from pathlib import Path

from source.endpoints import routes


def test_endpoint_layer_does_not_import_tesseract() -> None:
    """Verify endpoints do not own OCR or HTTP exception logic."""
    endpoint_source = "\n".join(
        path.read_text() for path in Path("source/endpoints").glob("*.py")
    )

    assert "source.ocr.tesseract" not in endpoint_source
    assert "HTTPException" not in endpoint_source


def test_endpoint_routers_are_discovered() -> None:
    """Verify endpoint routers are discovered programmatically."""
    route_paths = {route.path for router in routes for route in router.routes}

    assert "/health" in route_paths
    assert "/parse" in route_paths
