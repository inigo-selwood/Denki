import pytest
from pydantic import ValidationError

from source.models import (
    BoundingBox,
    HTMLDocument,
    HTMLElement,
    HTMLTag,
    Paragraph,
    ParsedImage,
    Sentence,
    Table,
    TableCell,
    TableRow,
    TextRole,
)


def test_parsed_image_accepts_layout_blocks() -> None:
    """Verify parsed images can contain mixed layout blocks."""
    bounds = BoundingBox(x=0, y=0, width=100, height=20)
    parsed_image = ParsedImage(
        width=400,
        height=300,
        contents=[
            Paragraph(role=TextRole.BODY, bounds=bounds, value="Body"),
            Table(
                bounds=bounds,
                rows=[
                    TableRow(
                        bounds=bounds,
                        cells=[
                            TableCell(
                                role=TextRole.HEADER,
                                bounds=bounds,
                                contents=[
                                    Paragraph(
                                        role=TextRole.HEADER,
                                        bounds=bounds,
                                        value="Amount",
                                    )
                                ],
                            )
                        ],
                    )
                ],
            ),
        ],
    )

    assert len(parsed_image.contents) == 2


def test_paragraph_tracks_sentence_bounds() -> None:
    """Verify paragraph sentences can span multiple bounding boxes."""
    sentence = Sentence(
        value="This wraps across lines.",
        bounds=[
            BoundingBox(x=0, y=0, width=100, height=10),
            BoundingBox(x=0, y=12, width=80, height=10),
        ],
    )
    paragraph = Paragraph(
        role=TextRole.BODY,
        bounds=BoundingBox(x=0, y=0, width=100, height=22),
        value="This wraps across lines.",
        sentences=[sentence],
    )

    assert len(paragraph.sentences[0].bounds) == 2


def test_bounding_box_rejects_negative_coordinates() -> None:
    """Verify bounding boxes use non-negative pixel values."""
    with pytest.raises(ValidationError):
        BoundingBox(x=-1, y=0, width=10, height=10)


def test_html_element_supports_nested_children() -> None:
    """Verify HTML elements can represent nested document structure."""
    element = HTMLElement(
        tag=HTMLTag.UL,
        children=[
            HTMLElement(
                tag=HTMLTag.LI,
                text="Hello",
                bounds=BoundingBox(x=1, y=2, width=3, height=4),
            )
        ],
    )

    assert element.children[0].tag == HTMLTag.LI


def test_html_document_renders_elements() -> None:
    """Verify HTML documents render modelled elements."""
    document = HTMLDocument(
        children=[
            HTMLElement(
                tag=HTMLTag.P,
                text="Hello",
                bounds=BoundingBox(x=1, y=2, width=3, height=4),
            )
        ]
    )

    assert document.render() == (
        '<html><body><p bounds="1,2,3,4">Hello</p></body></html>\n'
    )


def test_html_document_escapes_text() -> None:
    """Verify HTML text content is escaped when rendered."""
    document = HTMLDocument(
        children=[HTMLElement(tag=HTMLTag.P, text="A < B & C")]
    )

    assert document.render() == (
        "<html><body><p>A &lt; B &amp; C</p></body></html>\n"
    )
