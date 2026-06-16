from io import BytesIO
from uuid import uuid4

import pytesseract
from PIL import Image

from source.models.documents import (
    BoundingBox,
    OcrBlock,
    OcrDocument,
    OcrDocumentInput,
    OcrSection,
)
from source.services.document_engine import OcrEngine


class TesseractOcrEngine(OcrEngine):
    async def parse(self, document: OcrDocumentInput) -> OcrDocument:
        image = Image.open(BytesIO(document.content))
        text = pytesseract.image_to_string(image).strip()

        block = OcrBlock(
            block_id="block-0",
            kind="text",
            text=text,
            bbox=BoundingBox(
                page=1,
                left=0,
                top=0,
                width=float(image.width),
                height=float(image.height),
            ),
        )
        section = OcrSection(
            section_id="section-0",
            purpose="document_body",
            blocks=[block],
        )

        return OcrDocument(
            document_id=f"ocr_{uuid4().hex}",
            name=document.filename,
            sections=[section],
            text=text,
            metadata={"mimeType": document.mime_type},
        )
