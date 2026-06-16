from fastapi import UploadFile

from source.models.documents import OcrDocument, OcrDocumentInput
from source.services.documents import DocumentStructureService


class DocumentController:
    def __init__(self, document_service: DocumentStructureService) -> None:
        self._document_service = document_service

    async def parse(self, file: UploadFile) -> OcrDocument:
        content = await file.read()
        return await self._document_service.parse(
            OcrDocumentInput(
                filename=file.filename or "document",
                mime_type=file.content_type or "application/octet-stream",
                content=content,
            )
        )
