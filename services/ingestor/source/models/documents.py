from typing import Any

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    page: int
    left: float
    top: float
    width: float
    height: float


class OcrBlock(BaseModel):
    block_id: str = Field(serialization_alias="blockId")
    kind: str
    text: str | None = None
    bbox: BoundingBox | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class OcrSection(BaseModel):
    section_id: str = Field(serialization_alias="sectionId")
    heading: str | None = None
    purpose: str | None = None
    blocks: list[OcrBlock] = Field(default_factory=list)
    children: list["OcrSection"] = Field(default_factory=list)


class OcrDocumentInput(BaseModel):
    filename: str
    mime_type: str = Field(serialization_alias="mimeType")
    content: bytes


class OcrDocument(BaseModel):
    document_id: str = Field(serialization_alias="documentId")
    name: str
    sections: list[OcrSection]
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)
