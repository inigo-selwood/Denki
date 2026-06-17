from source.models import HTMLDocument


def parse(content: bytes, mime_type: str) -> str:
    """Parse image bytes into HTML.

    Parameters
    ----------
    content
        Raw uploaded image bytes.
    mime_type
        MIME type validated by the controller.

    Returns
    -------
    str
        HTML representation of the parsed image structure.
    """
    document = HTMLDocument()

    return document.render()
