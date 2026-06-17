from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """Pixel bounds for a visible region in the source image."""

    x: int = Field(ge=0)
    y: int = Field(ge=0)
    width: int = Field(ge=0)
    height: int = Field(ge=0)
