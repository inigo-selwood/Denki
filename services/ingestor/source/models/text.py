from enum import StrEnum

from pydantic import BaseModel, Field

from source.models.geometry import BoundingBox


class TextRole(StrEnum):
    """Semantic role for a text-bearing element."""

    HEADER = "header"
    BODY = "body"


class Sentence(BaseModel):
    """Sentence within a paragraph.

    A sentence may wrap across multiple visual lines, so it can have more than
    one bounding box.
    """

    value: str
    bounds: list[BoundingBox] = Field(default_factory=list)


class Paragraph(BaseModel):
    """Paragraph block for continuous text."""

    role: TextRole
    bounds: BoundingBox
    value: str
    sentences: list[Sentence] = Field(default_factory=list)
