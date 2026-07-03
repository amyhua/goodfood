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

## /solve (Prompt 5)
POST `/solve` runs OR-Tools CP-SAT to select foods + gram portions across meals.
Strict mode enforces all hard nutrient/calorie/macro bounds, meal templates, and
locks; diagnostic mode minimizes violations and explains the smallest changes. A
hit time budget returns `TIME_LIMIT` (never `INFEASIBLE`). The solver returns
selections only — TypeScript (`@goodfood/domain`) computes the canonical proof.

The OpenAPI contract is generated into the TS client:
```bash
# regenerate packages/api-client/openapi.json + src/solver-schema.ts
python -c "import json;from app.main import app;print(json.dumps(app.openapi()))" > ../../packages/api-client/openapi.json
pnpm --filter @goodfood/api-client gen:solver
```
