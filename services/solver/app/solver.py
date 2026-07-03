"""OR-Tools CP-SAT meal solver (Prompt 5, GOO-21).

Integer gram portions on a fixed increment. Hard nutrient/calorie/macro bounds,
meal templates, locks, and pre-filtered bans in STRICT mode; a DIAGNOSTIC relaxed
mode minimizes weighted violations and explains the smallest changes to try.

Determinism: single worker + fixed random seed. A hit time budget yields
TIME_LIMIT (never INFEASIBLE) — infeasibility is only claimed when proven.
The solver treats MISSING nutrient values as 0 for its own feasibility math;
TypeScript remains the canonical, honest proof calculator (missing => UNKNOWN).
"""
from __future__ import annotations

import math
import time
from typing import Optional

from ortools.sat.python import cp_model

from .models import (
    ConstraintViolation,
    Diagnostics,
    Infeasibility,
    MealResult,
    NutrientConstraint,
    NutrientMode,
    SelectedItem,
    SolveMode,
    SolveRequest,
    SolveResponse,
    SolveStatus,
)

SCALE = 1000  # fixed-point scaling for nutrient amounts (milli-units)


def _band(c: NutrientConstraint) -> tuple[Optional[float], Optional[float]]:
    """Return (lo, hi) for a constraint, applying tolerance to a target."""
    if c.mode == NutrientMode.MINIMUM:
        return (c.min, None)
    if c.mode == NutrientMode.MAXIMUM:
        return (None, c.max)
    if c.mode == NutrientMode.TARGET:
        lo = c.min if c.min is not None else (c.target or 0) * (1 - c.tolerance_low_pct / 100)
        hi = c.max if c.max is not None else (c.target or 0) * (1 + c.tolerance_high_pct / 100)
        return (lo, hi)
    return (None, None)


def solve(req: SolveRequest) -> SolveResponse:
    started = time.monotonic()
    banned = set(req.banned_food_ids)
    inc = max(1, req.gram_increment)
    foods = [f for f in req.foods if f.id not in banned]
    required_meals = [m for m in req.meals if m.required]

    # Pre-check: a required meal / template tag with no candidate is provably infeasible.
    pre_violations: list[ConstraintViolation] = []
    for m in required_meals:
        cands = [f for f in foods if m.role in f.meal_roles]
        if not cands:
            pre_violations.append(
                ConstraintViolation(
                    key=m.role,
                    kind="meal_unfillable",
                    suggestion=f"no candidate foods for meal '{m.role}'; add eligible foods",
                )
            )
        for tag in m.template_tags:
            if not any(tag in f.tags for f in cands):
                pre_violations.append(
                    ConstraintViolation(
                        key=f"{m.role}:{tag}",
                        kind="template_uncovered",
                        suggestion=f"no '{tag}' food available for meal '{m.role}'",
                    )
                )
    if pre_violations:
        return SolveResponse(
            status=SolveStatus.INFEASIBLE,
            feasible=False,
            diagnostics=Diagnostics(
                candidate_count=len(foods),
                selected_count=0,
                binding_constraints=[v.key for v in pre_violations],
                notes=["structural infeasibility detected before solving"],
            ),
            infeasibility=Infeasibility(
                explanation="Some required meals cannot be filled with the given candidates.",
                violations=pre_violations,
            ),
            seed=req.seed,
            solve_time_ms=int((time.monotonic() - started) * 1000),
        )

    diagnostic = req.mode == SolveMode.DIAGNOSTIC
    result = _run_model(req, foods, required_meals, inc, soft=diagnostic, started=started)

    # If a strict solve is infeasible, re-run relaxed to explain it.
    if result.status == SolveStatus.INFEASIBLE and not diagnostic:
        relaxed = _run_model(req, foods, required_meals, inc, soft=True, started=started)
        result.infeasibility = relaxed.infeasibility or Infeasibility(
            explanation="No plan satisfies all hard constraints.",
            violations=[],
        )
        result.diagnostics.binding_constraints = (
            relaxed.diagnostics.binding_constraints or result.diagnostics.binding_constraints
        )
        result.diagnostics.notes.append("relaxed diagnostic identified the binding constraints")
    return result


def _run_model(req, foods, required_meals, inc, soft: bool, started: float) -> SolveResponse:
    model = cp_model.CpModel()
    units: dict[tuple[str, str], cp_model.IntVar] = {}
    sel: dict[tuple[str, str], cp_model.IntVar] = {}
    food_by_id = {f.id: f for f in foods}

    for f in foods:
        max_units = max(0, int(f.max_grams // inc))
        min_units = max(1, math.ceil(f.min_grams / inc)) if f.min_grams > 0 else 1
        for role in f.meal_roles:
            u = model.NewIntVar(0, max_units, f"u_{f.id}_{role}")
            s = model.NewBoolVar(f"s_{f.id}_{role}")
            model.Add(u <= max_units * s)
            model.Add(u >= min_units * s)
            model.Add(u >= 1).OnlyEnforceIf(s)
            units[(f.id, role)] = u
            sel[(f.id, role)] = s

    # Locks: force selection + grams.
    for lock in req.locked_ingredients:
        key = (lock.food_id, lock.meal_role)
        if key in units:
            model.Add(units[key] == round(lock.grams / inc))
            model.Add(sel[key] == 1)

    # Required meals: at least one food; template tags covered; optional grams cap.
    for m in required_meals:
        meal_sel = [sel[(f.id, m.role)] for f in foods if m.role in f.meal_roles]
        if meal_sel:
            model.Add(sum(meal_sel) >= 1)
        for tag in m.template_tags:
            covering = [sel[(f.id, m.role)] for f in foods if m.role in f.meal_roles and tag in f.tags]
            if covering:
                model.Add(sum(covering) >= 1)
        if m.max_total_grams is not None:
            meal_units = [units[(f.id, m.role)] for f in foods if m.role in f.meal_roles]
            if meal_units:
                model.Add(sum(u * inc for u in meal_units) <= int(m.max_total_grams))

    # Nutrient totals as scaled linear expressions.
    def total_expr(key: str):
        terms = []
        for f in foods:
            v = f.per100g.get(key)
            if v is None:
                continue
            coef = round(v * inc / 100 * SCALE)
            if coef == 0:
                continue
            for role in f.meal_roles:
                terms.append(coef * units[(f.id, role)])
        return sum(terms) if terms else 0

    penalties = []
    binding: list[str] = []
    violations_meta: list[tuple[str, str, float]] = []  # (key, kind, target)

    for c in req.nutrient_constraints:
        if c.mode == NutrientMode.DISABLED:
            continue
        lo, hi = _band(c)
        expr = total_expr(c.key)
        if lo is not None:
            lo_s = round(lo * SCALE)
            if soft:
                under = model.NewIntVar(0, lo_s, f"under_{c.key}")
                model.Add(expr + under >= lo_s)
                penalties.append(under * 1000)
                violations_meta.append((c.key, "under", lo))
            else:
                model.Add(expr >= lo_s)
        if hi is not None:
            hi_s = round(hi * SCALE)
            if soft:
                over = model.NewIntVar(0, 10**9, f"over_{c.key}")
                model.Add(expr - over <= hi_s)
                penalties.append(over * 1000)
                violations_meta.append((c.key, "over", hi))
            else:
                model.Add(expr <= hi_s)

    # Objective: prefer pantry, fewer foods, smaller deviation (+ relaxed penalties).
    obj = []
    for (fid, role), s in sel.items():
        f = food_by_id[fid]
        obj.append(req.weights.food_count * s)
        if not f.is_pantry:
            obj.append(req.weights.pantry * s)
    for c in req.nutrient_constraints:
        if c.mode == NutrientMode.TARGET:
            tgt = round((c.target or 0) * SCALE)
            expr = total_expr(c.key)
            dev = model.NewIntVar(0, 10**9, f"dev_{c.key}")
            model.Add(dev >= expr - tgt)
            model.Add(dev >= tgt - expr)
            obj.append(req.weights.deviation * dev)
    obj.extend(penalties)
    model.Minimize(sum(obj) if obj else 0)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max(0.1, req.time_budget_sec)
    solver.parameters.random_seed = req.seed
    solver.parameters.num_search_workers = 1
    cp_status = solver.Solve(model)

    elapsed_ms = int((time.monotonic() - started) * 1000)
    hit_limit = cp_status == cp_model.UNKNOWN

    if cp_status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        status = SolveStatus.OPTIMAL if cp_status == cp_model.OPTIMAL else SolveStatus.FEASIBLE
        meals_out: dict[str, MealResult] = {m.role: MealResult(role=m.role) for m in req.meals}
        selected_count = 0
        for (fid, role), u in units.items():
            grams = solver.Value(u) * inc
            if grams <= 0:
                continue
            selected_count += 1
            f = food_by_id[fid]
            meals_out.setdefault(role, MealResult(role=role)).items.append(
                SelectedItem(food_id=fid, name=f.name, grams=float(grams), from_pantry=f.is_pantry)
            )
        totals: dict[str, float] = {}
        for c in req.nutrient_constraints:
            s = 0.0
            for (fid, role), u in units.items():
                v = food_by_id[fid].per100g.get(c.key)
                if v is None:
                    continue
                s += v * (solver.Value(u) * inc) / 100
            totals[c.key] = round(s, 4)

        # In soft mode, report which soft constraints were violated.
        infeasibility = None
        soft_violations: list[ConstraintViolation] = []
        if soft:
            for key, kind, ref in violations_meta:
                var_name = f"{'under' if kind == 'under' else 'over'}_{key}"
                # recompute slack from totals vs reference
                achieved = totals.get(key, 0.0)
                if kind == "under" and achieved + 1e-6 < ref:
                    soft_violations.append(
                        ConstraintViolation(
                            key=key, kind="under", needed=ref, achieved=round(achieved, 4),
                            suggestion=f"increase or add a source of {key}, or lower its minimum to <= {round(achieved,2)}",
                        )
                    )
                    binding.append(key)
                elif kind == "over" and achieved > ref + 1e-6:
                    soft_violations.append(
                        ConstraintViolation(
                            key=key, kind="over", needed=ref, achieved=round(achieved, 4),
                            suggestion=f"reduce {key} sources, or raise its maximum to >= {round(achieved,2)}",
                        )
                    )
                    binding.append(key)
            if soft_violations:
                infeasibility = Infeasibility(
                    explanation="No plan satisfies all hard constraints; smallest changes shown.",
                    violations=soft_violations,
                )

        return SolveResponse(
            status=status,
            feasible=not soft_violations,
            meals=[meals_out[m.role] for m in req.meals if m.role in meals_out],
            nutrient_totals=totals,
            objective_score=solver.ObjectiveValue(),
            solve_time_ms=elapsed_ms,
            seed=req.seed,
            diagnostics=Diagnostics(
                candidate_count=len(foods),
                selected_count=selected_count,
                binding_constraints=sorted(set(binding)),
            ),
            infeasibility=infeasibility,
        )

    if hit_limit:
        # Timeout with no solution found — NEVER reported as infeasible.
        return SolveResponse(
            status=SolveStatus.TIME_LIMIT,
            feasible=False,
            diagnostics=Diagnostics(
                candidate_count=len(foods),
                selected_count=0,
                notes=["time budget exhausted before a solution was found; not proven infeasible"],
            ),
            seed=req.seed,
            solve_time_ms=elapsed_ms,
        )

    # Proven infeasible.
    return SolveResponse(
        status=SolveStatus.INFEASIBLE,
        feasible=False,
        diagnostics=Diagnostics(candidate_count=len(foods), selected_count=0),
        seed=req.seed,
        solve_time_ms=elapsed_ms,
    )
