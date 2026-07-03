"""FastAPI entrypoint for the goodfood solver service.

Prompt 1 ships liveness/readiness only. The OR-Tools `/solve` endpoint and its
Pydantic contract arrive in Prompt 5. The solver holds no DB or secret access.
"""
from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from . import __version__
from .models import SolveRequest, SolveResponse
from .solver import solve as run_solve

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


@app.post("/solve", response_model=SolveResponse)
def solve_endpoint(req: SolveRequest) -> SolveResponse:
    """Optimize a meal plan (selections only; TypeScript computes the canonical proof)."""
    return run_solve(req)
