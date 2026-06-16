from fastapi import FastAPI

from source.controllers.documents import DocumentController
from source.endpoints.documents import router as documents_router
from source.endpoints.health import router as health_router
from source.integrations.tesseract import TesseractOcrEngine
from source.services.documents import DocumentStructureService


def create_app() -> FastAPI:
    app = FastAPI(title="Denki Ingestor Service")
    document_service = DocumentStructureService(TesseractOcrEngine())
    app.state.document_controller = DocumentController(document_service)
    app.include_router(health_router)
    app.include_router(documents_router)
    return app
