from typing import Annotated

from fastapi import File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from source import services
from source.controllers.parse import SUPPORTED_IMAGE_TYPES


async def annotate(
    file: Annotated[UploadFile, File()],
    markup: Annotated[str, Form()],
) -> Response:
    """Validate and annotate an uploaded image from markup.

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

    Raises
    ------
    HTTPException
        Raised when the uploaded media type is not supported.
    """
    mime_type = file.content_type or "application/octet-stream"

    if mime_type not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type: {mime_type}",
        )

    image = services.annotate(
        content=await file.read(),
        markup=markup,
    )

    return Response(content=image, media_type="image/png")
