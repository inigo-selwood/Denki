from enum import StrEnum

from pydantic import BaseModel, Field

from source.models.geometry import BoundingBox
from source.models.text import Paragraph, TextRole


class ImageRegion(BaseModel):
    """Non-text image region found inside the source image."""

    bounds: BoundingBox
    alt: str | None = None


class ListElement(BaseModel):
    """Single item within an ordered or unordered list."""

    bounds: BoundingBox
    contents: list[Paragraph] = Field(default_factory=list)


class ListKind(StrEnum):
    """Supported list styles."""

    ORDERED = "ordered"
    UNORDERED = "unordered"


class ListBlock(BaseModel):
    """List block containing one or more list items."""

    kind: ListKind
    bounds: BoundingBox
    elements: list[ListElement] = Field(default_factory=list)


class TableCell(BaseModel):
    """Cell within a table row."""

    role: TextRole
    bounds: BoundingBox
    contents: list[Paragraph] = Field(default_factory=list)
    colspan: int = Field(default=1, ge=1)
    rowspan: int = Field(default=1, ge=1)


class TableRow(BaseModel):
    """Row within a table."""

    bounds: BoundingBox
    cells: list[TableCell] = Field(default_factory=list)


class Table(BaseModel):
    """Table block containing rows and cells."""

    bounds: BoundingBox
    rows: list[TableRow] = Field(default_factory=list)


LayoutBlock = Paragraph | ImageRegion | ListBlock | Table


class ParsedImage(BaseModel):
    """Structured parse result for a single source image."""

    width: int = Field(ge=0)
    height: int = Field(ge=0)
    contents: list[LayoutBlock] = Field(default_factory=list)
