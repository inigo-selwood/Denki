from typing import Annotated

from fastapi import File, HTTPException, Request, UploadFile
from fastapi.responses import Response

from source import services

SUPPORTED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/tiff",
}


async def parse(
    request: Request,
    file: Annotated[UploadFile, File()],
) -> Response:
    """Validate and parse an uploaded image.

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

    html = services.parse(
        content=await file.read(),
        mime_type=mime_type,
    )

    return Response(content=html, media_type="text/html")
