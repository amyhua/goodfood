# services/solver

Python 3.12 · FastAPI · (OR-Tools from Prompt 5). Optimization service for goodfood.
Stateless; no DB or secret access. Returns selected foods/grams only — TypeScript is
the canonical nutrient-proof calculator.

## Run locally
```bash
pnpm solver:dev        # from repo root — venv + uvicorn on :8000
# or:
PYTHON=python3.12 services/solver/scripts/dev.sh
curl localhost:8000/health
```

## Test
```bash
pnpm solver:test       # venv + pytest
```
