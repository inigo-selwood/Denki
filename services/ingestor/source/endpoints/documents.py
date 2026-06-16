from fastapi import APIRouter, File, Request, UploadFile

router = APIRouter()


@router.post("/documents/parse")
async def parse_document(
    request: Request,
    file: UploadFile = File(...),
) -> dict:
    controller = request.app.state.document_controller
    document = await controller.parse(file)
    return document.model_dump(by_alias=True)
