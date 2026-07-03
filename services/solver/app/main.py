"""FastAPI entrypoint for the goodfood solver service.

Prompt 1 ships liveness/readiness only. The OR-Tools `/solve` endpoint and its
Pydantic contract arrive in Prompt 5. The solver holds no DB or secret access.
"""
from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from . import __version__

app = FastAPI(title="goodfood-solver", version=__version__)


class Health(BaseModel):
    status: str
    service: str
    version: str


@app.get("/health", response_model=Health)
def health() -> Health:
    """Liveness probe."""
    return Health(status="ok", service="solver", version=__version__)


@app.get("/ready", response_model=Health)
def ready() -> Health:
    """Readiness probe (no external deps yet)."""
    return Health(status="ok", service="solver", version=__version__)
