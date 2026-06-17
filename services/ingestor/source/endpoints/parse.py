from typing import Annotated

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response

from source import controllers

router = APIRouter()


@router.post("/parse")
async def parse(
    file: Annotated[UploadFile, File()],
) -> Response:
    """Delegate the parse endpoint to its controller.

    Parameters
    ----------
    file
        Uploaded image file from the multipart request.

    Returns
    -------
    Response
        HTML parse response.
    """
    return await controllers.parse(file=file)
