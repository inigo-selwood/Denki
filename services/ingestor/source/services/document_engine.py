from typing import Protocol

from source.models.documents import OcrDocument, OcrDocumentInput


class OcrEngine(Protocol):
    async def parse(self, document: OcrDocumentInput) -> OcrDocument:
        pass
