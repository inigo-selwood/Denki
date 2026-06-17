from __future__ import annotations

from io import BytesIO
from xml.etree import ElementTree

from PIL import Image, ImageDraw

BOUNDING_BOX_COLORS = (
    "#f97316",
    "#0ea5e9",
    "#22c55e",
    "#e11d48",
    "#8b5cf6",
    "#facc15",
)


def annotate(content: bytes, markup: str) -> bytes:
    """Render markup bounds onto an image.

    Parameters
    ----------
    content
        Raw image bytes.
    markup
        Ingestor HTML containing ``bounds`` attributes.

    Returns
    -------
    bytes
        PNG image bytes with colored bounding boxes.
    """
    with Image.open(BytesIO(content)) as source_image:
        image = source_image.convert("RGBA")

    overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    root = ElementTree.fromstring(markup)
    box_index = 0

    # Walk the rendered ingestor HTML and draw every element with bounds.
    for element in root.iter():
        raw_bounds = element.attrib.get("bounds")
        if raw_bounds is None:
            continue

        bounds = tuple(int(value) for value in raw_bounds.split(","))
        if len(bounds) != 4:
            continue

        label = element.attrib.get("source-label", element.tag)
        color = BOUNDING_BOX_COLORS[box_index % len(BOUNDING_BOX_COLORS)]
        x, y, width, height = bounds
        box = (x, y, x + width, y + height)
        draw.rectangle(box, outline=color, width=3)
        draw.text((x + 4, y + 4), label, fill=color)
        box_index += 1

    output = BytesIO()
    Image.alpha_composite(image, overlay).convert("RGB").save(
        output,
        format="PNG",
    )
    return output.getvalue()
