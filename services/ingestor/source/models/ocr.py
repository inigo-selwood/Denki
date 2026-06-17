from typing import Protocol

from pydantic import BaseModel, Field

from source.models.geometry import BoundingBox


class OCRBlock(BaseModel):
    """Text-bearing structure found by an OCR engine."""

    label: str
    text: str
    bounds: BoundingBox
    confidence: float | None = None
    attributes: dict[str, str] = Field(default_factory=dict)


class OCRDocument(BaseModel):
    """Normalized OCR engine output for one parsed image."""

    width: int
    height: int
    blocks: list[OCRBlock] = Field(default_factory=list)


class OCREngine(Protocol):
    """Black-box OCR engine boundary."""

    def parse(self, content: bytes, mime_type: str) -> OCRDocument:
        """Parse image content into normalized OCR blocks.

        Parameters
        ----------
        content
            Raw uploaded image bytes.
        mime_type
            MIME type validated by the controller.

        Returns
        -------
        OCRDocument
            Normalized OCR document.
        """
