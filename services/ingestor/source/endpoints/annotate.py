from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response

from source import controllers

router = APIRouter()


@router.post("/annotate")
async def annotate(
    file: Annotated[UploadFile, File()],
    markup: Annotated[str, Form()],
) -> Response:
    """Delegate the annotate endpoint to its controller.

    Parameters
    ----------
    file
        Uploaded source image.
    markup
        Ingestor HTML containing ``bounds`` attributes.

    Returns
    -------
    Response
        PNG annotation response.
    """
    return await controllers.annotate(
        file=file,
        markup=markup,
    )
