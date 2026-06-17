from importlib import import_module
from pkgutil import iter_modules

from fastapi import APIRouter

routes = []

for module in sorted(iter_modules(__path__), key=lambda item: item.name):
    if module.name.startswith("_"):
        continue

    imported_module = import_module(f"{__name__}.{module.name}")
    router = getattr(imported_module, "router", None)

    if isinstance(router, APIRouter):
        routes.append(router)
