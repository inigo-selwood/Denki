from typing import Annotated

from fastapi import APIRouter, File, Request, UploadFile
from fastapi.responses import Response

from source import controllers

router = APIRouter()


@router.post("/parse")
async def parse(
    request: Request,
    file: Annotated[UploadFile, File()],
) -> Response:
    """Delegate the parse endpoint to its controller.

    Parameters
    ----------
    request
        FastAPI request object for the inbound parse call.
    file
        Uploaded image file from the multipart request.

    Returns
    -------
    Response
        HTML parse response.
    """
    return await controllers.parse(request=request, file=file)
