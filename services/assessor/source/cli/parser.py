from __future__ import annotations

import argparse
import os

from source.cli import commands

DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 9000


def build_parser() -> argparse.ArgumentParser:
    """Build the assessor command-line parser.

    Returns
    -------
    argparse.ArgumentParser
        Parser for assessor commands.
    """
    parser = argparse.ArgumentParser(
        prog="denki-assessor",
        description="Run the assessor service.",
    )
    subparsers = parser.add_subparsers(dest="command")

    serve_parser = subparsers.add_parser(
        "serve",
        help="run the FastAPI service with Uvicorn",
    )
    serve_parser.add_argument(
        "--host",
        default=os.environ.get("ASSESSOR_HOST", DEFAULT_HOST),
        help=f"host interface to bind (default: {DEFAULT_HOST})",
    )
    serve_parser.add_argument(
        "--port",
        default=int(os.environ.get("ASSESSOR_PORT", DEFAULT_PORT)),
        type=int,
        help=f"port to bind (default: {DEFAULT_PORT})",
    )
    serve_parser.set_defaults(handler=commands.handle_serve)

    parser.set_defaults(
        handler=commands.handle_serve,
        host=os.environ.get("ASSESSOR_HOST", DEFAULT_HOST),
        port=int(os.environ.get("ASSESSOR_PORT", DEFAULT_PORT)),
    )
    return parser
