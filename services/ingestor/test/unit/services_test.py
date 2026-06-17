from source.models import BoundingBox, OCRBlock, OCRDocument
from source.services import parse


class FakeOCREngine:
    """Fake OCR engine for service tests."""

    def parse(self, content: bytes, mime_type: str) -> OCRDocument:
        """Return stable OCR output.

        Parameters
        ----------
        content
            Raw image bytes.
        mime_type
            Uploaded image MIME type.

        Returns
        -------
        OCRDocument
            Stable fake OCR document.
        """
        return OCRDocument(
            width=200,
            height=100,
            blocks=[
                OCRBlock(
                    label="title",
                    text="Invoice",
                    bounds=BoundingBox(x=0, y=0, width=100, height=20),
                    confidence=0.95,
                ),
                OCRBlock(
                    label="text",
                    text="Total 100",
                    bounds=BoundingBox(x=0, y=30, width=80, height=10),
                ),
            ],
        )


def test_parse_renders_ocr_blocks_as_html() -> None:
    """Verify parse renders normalized OCR blocks."""
    html = parse(
        content=b"fake-image",
        mime_type="image/png",
        engine=FakeOCREngine(),
    )

    assert html == (
        '<html><body><h1 bounds="0,0,100,20" confidence="0.95" '
        'source-label="title">Invoice</h1><p bounds="0,30,80,10" '
        'source-label="text">Total 100</p></body></html>\n'
    )
