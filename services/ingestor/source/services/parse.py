from source.models import (
    HTMLDocument,
    HTMLElement,
    HTMLTag,
    OCREngine,
)
from source.ocr import PaddleOCREngine

HEADER_LABELS = {
    "doc_title",
    "header",
    "heading",
    "section_title",
    "title",
}


def parse(
    content: bytes,
    mime_type: str,
    engine: OCREngine | None = None,
) -> str:
    """Parse image bytes into HTML.

    Parameters
    ----------
    content
        Raw uploaded image bytes.
    mime_type
        MIME type validated by the controller.
    engine
        Optional OCR engine. Defaults to PaddleOCR.

    Returns
    -------
    str
        HTML representation of the parsed image structure.
    """
    ocr_engine = engine or PaddleOCREngine()
    ocr_document = ocr_engine.parse(content=content, mime_type=mime_type)

    children = []
    for block in ocr_document.blocks:
        label = block.label.lower()
        tag = HTMLTag.H1 if label in HEADER_LABELS else HTMLTag.P
        attributes = {"source-label": block.label}

        if block.confidence is not None:
            attributes["confidence"] = str(block.confidence)

        children.append(
            HTMLElement(
                tag=tag,
                bounds=block.bounds,
                text=block.text,
                attributes=attributes,
            )
        )

    document = HTMLDocument(children=children)

    return document.render()
