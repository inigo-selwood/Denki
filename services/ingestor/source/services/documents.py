from source.models.documents import OcrDocument, OcrDocumentInput
from source.services.document_engine import OcrEngine


class DocumentStructureService:
    def __init__(self, ocr_engine: OcrEngine) -> None:
        self._ocr_engine = ocr_engine

    async def parse(self, document: OcrDocumentInput) -> OcrDocument:
        return await self._ocr_engine.parse(document)
