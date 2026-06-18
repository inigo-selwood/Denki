from __future__ import annotations

import argparse

import uvicorn


def handle_serve(namespace: argparse.Namespace) -> None:
    """Run the Uvicorn service process."""
    uvicorn.run(
        "source.main:run",
        factory=True,
        host=namespace.host,
        port=namespace.port,
    )
