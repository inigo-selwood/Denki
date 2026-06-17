from __future__ import annotations

from enum import StrEnum
from xml.etree import ElementTree

from pydantic import BaseModel, Field

from source.models.geometry import BoundingBox


class HTMLTag(StrEnum):
    """HTML tags supported by the ingestor renderer."""

    H1 = "h1"
    P = "p"
    TABLE = "table"
    TBODY = "tbody"
    TR = "tr"
    TH = "th"
    TD = "td"
    UL = "ul"
    OL = "ol"
    LI = "li"


class HTMLElement(BaseModel):
    """HTML element produced by the ingestor renderer."""

    tag: HTMLTag
    bounds: BoundingBox | None = None
    text: str | None = None
    children: list[HTMLElement] = Field(default_factory=list)
    attributes: dict[str, str] = Field(default_factory=dict)

    def render(self) -> str:
        """Render the element as an HTML string.

        Returns
        -------
        str
            HTML representation of the element and its children.
        """
        return ElementTree.tostring(
            self._to_element(),
            encoding="unicode",
            method="html",
        )

    def _to_element(self) -> ElementTree.Element:
        """Convert the model into an ElementTree element.

        Returns
        -------
        ElementTree.Element
            ElementTree representation of the element and its children.
        """
        attributes = dict(self.attributes)

        if self.bounds is not None:
            bounds = self.bounds
            attributes["bounds"] = (
                f"{bounds.x},{bounds.y},{bounds.width},{bounds.height}"
            )

        element = ElementTree.Element(
            self.tag.value,
            dict(sorted(attributes.items())),
        )

        element.text = self.text

        for child in self.children:
            element.append(child._to_element())

        return element


class HTMLDocument(BaseModel):
    """Complete HTML document returned by the ingestor."""

    children: list[HTMLElement] = Field(default_factory=list)

    def render(self) -> str:
        """Render the document as an HTML string.

        Returns
        -------
        str
            HTML document containing all rendered body children.
        """
        root = ElementTree.Element("html")
        body = ElementTree.SubElement(root, "body")

        for child in self.children:
            body.append(child._to_element())

        return (
            ElementTree.tostring(root, encoding="unicode", method="html")
            + "\n"
        )
