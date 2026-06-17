from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Delegate the health endpoint to its controller.

    Returns
    -------
    HealthResponse
        Static health payload.
    """
    return HealthResponse(status="ok")
