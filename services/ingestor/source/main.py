from fastapi import FastAPI

from source.cli import main as cli_main
from source.endpoints import routes


def run() -> FastAPI:
    """Create the FastAPI application.

    Returns
    -------
    FastAPI
        Configured FastAPI application with discovered endpoint routers.
    """
    app = FastAPI(title="Ingestor")
    for route in routes:
        app.include_router(route)

    return app


if __name__ == "__main__":
    raise SystemExit(cli_main())
