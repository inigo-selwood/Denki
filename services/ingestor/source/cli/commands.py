from __future__ import annotations

import argparse
import mimetypes
import sys
import webbrowser
from pathlib import Path

import uvicorn

from source import services

TEMP_OUTPUT_DIR = Path(".cache/outputs")


def validate_parse_args(
    parser: argparse.ArgumentParser,
    namespace: argparse.Namespace,
) -> None:
    """Validate parse-specific argument combinations."""
    if (
        namespace.format == "image"
        and namespace.output is None
        and not namespace.open
    ):
        parser.error(
            "parse-annotate: --format image requires --output or --open"
        )


def handle_serve(namespace: argparse.Namespace) -> None:
    """Run the Uvicorn service process."""
    uvicorn.run(
        "source.main:run",
        factory=True,
        host=namespace.host,
        port=namespace.port,
    )


def handle_parse(namespace: argparse.Namespace) -> None:
    """Parse an image path and write the requested output format."""
    image_path = namespace.image
    mime_type, _ = mimetypes.guess_type(image_path)
    if mime_type is None:
        raise SystemExit(f"Could not determine image MIME type: {image_path}")

    content = image_path.read_bytes()

    output_path = namespace.output
    if namespace.open and output_path is None:
        extension = "png" if namespace.format == "image" else "html"
        output_path = TEMP_OUTPUT_DIR / f"{image_path.stem}.{extension}"

    # Parse first so both output formats share the same OCR result.
    markup = services.parse(
        content=content,
        mime_type=mime_type,
    )

    if output_path is None:
        sys.stdout.write(markup)
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if namespace.format == "image":
        output_path.write_bytes(
            services.annotate(content=content, markup=markup)
        )
    else:
        output_path.write_text(markup, encoding="utf-8")

    if namespace.open:
        webbrowser.open(output_path.resolve().as_uri())
