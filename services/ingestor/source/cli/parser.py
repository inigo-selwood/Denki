from __future__ import annotations

import argparse
import os
from pathlib import Path

from source.cli import commands

DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000


def build_parser() -> argparse.ArgumentParser:
    """Build the ingestor command-line parser.

    Returns
    -------
    argparse.ArgumentParser
        Parser for ingestor commands.
    """
    parser = argparse.ArgumentParser(
        prog="denki-ingestor",
        description="Run the ingestor service or parse a document image.",
    )
    subparsers = parser.add_subparsers(dest="command")

    serve_parser = subparsers.add_parser(
        "serve",
        help="run the FastAPI service with Uvicorn",
    )
    serve_parser.add_argument(
        "--host",
        default=os.environ.get("INGESTOR_HOST", DEFAULT_HOST),
        help=f"host interface to bind (default: {DEFAULT_HOST})",
    )
    serve_parser.add_argument(
        "--port",
        default=int(os.environ.get("INGESTOR_PORT", DEFAULT_PORT)),
        type=int,
        help=f"port to bind (default: {DEFAULT_PORT})",
    )
    serve_parser.set_defaults(handler=commands.handle_serve)

    parse_annotate_parser = subparsers.add_parser(
        "parse-annotate",
        help="parse an image and write markup or annotation output",
    )
    parse_annotate_parser.add_argument(
        "image",
        type=Path,
        help="image file to parse",
    )
    parse_annotate_parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="write output to this path instead of stdout",
    )
    parse_annotate_parser.add_argument(
        "--format",
        choices=("html", "image"),
        default="image",
        help="output format (default: image)",
    )
    parse_annotate_parser.add_argument(
        "--open",
        action="store_true",
        help="open file output in a browser; uses .cache/outputs when needed",
    )
    parse_annotate_parser.set_defaults(handler=commands.handle_parse)

    parser.set_defaults(
        handler=commands.handle_serve,
        host=os.environ.get("INGESTOR_HOST", DEFAULT_HOST),
        port=int(os.environ.get("INGESTOR_PORT", DEFAULT_PORT)),
    )
    return parser
