"""Solver tests (Prompt 5, GOO-21). No network; pure CP-SAT."""
from __future__ import annotations

from app.models import (
    CandidateFood,
    LockedIngredient,
    MealSpec,
    NutrientConstraint,
    NutrientMode,
    SolveMode,
    SolveRequest,
    SolveStatus,
)
from app.solver import solve


def food(fid, name, roles, per100g, tags, **kw):
    return CandidateFood(id=fid, name=name, meal_roles=roles, per100g=per100g, tags=tags, **kw)


BREAKFAST = ["BREAKFAST"]
LUNCHDIN = ["LUNCH", "DINNER"]

BASE_FOODS = [
    food("oats", "Oats", BREAKFAST, {"energy": 71, "protein": 2.5}, ["grain", "vegan"]),
    food("berries", "Berries", BREAKFAST, {"energy": 57, "protein": 1.0}, ["fruit", "vegan"]),
    food("eggs", "Eggs", BREAKFAST, {"energy": 155, "protein": 13, "vitamin_b12": 1.1}, ["animal"]),
    food("yogurt", "Yogurt", BREAKFAST, {"energy": 60, "protein": 10, "vitamin_b12": 0.5}, ["dairy"]),
    food("tofu", "Tofu", LUNCHDIN, {"energy": 144, "protein": 15}, ["legume", "vegan"]),
    food("kale", "Kale", LUNCHDIN, {"energy": 35, "protein": 2.9}, ["vegetable", "vegan"]),
    food("rice", "Rice", LUNCHDIN, {"energy": 130, "protein": 2.7}, ["grain", "vegan"]),
    food("salmon", "Salmon", LUNCHDIN, {"energy": 206, "protein": 22, "vitamin_b12": 3.2}, ["fish", "animal"]),
]

MEALS = [MealSpec(role="BREAKFAST"), MealSpec(role="LUNCH"), MealSpec(role="DINNER")]


def base_request(**kw) -> SolveRequest:
    defaults = dict(
        foods=BASE_FOODS,
        meals=MEALS,
        nutrient_constraints=[
            NutrientConstraint(key="energy", mode=NutrientMode.TARGET, target=500,
                               tolerance_low_pct=30, tolerance_high_pct=30),
            NutrientConstraint(key="protein", mode=NutrientMode.MINIMUM, min=40),
        ],
        seed=42,
        time_budget_sec=5.0,
    )
    defaults.update(kw)
    return SolveRequest(**defaults)


def test_finds_valid_one_day_plan():
    res = solve(base_request())
    assert res.status in (SolveStatus.OPTIMAL, SolveStatus.FEASIBLE)
    assert res.feasible is True
    # Three meal groups, each non-empty with positive, increment-aligned grams.
    assert {m.role for m in res.meals} == {"BREAKFAST", "LUNCH", "DINNER"}
    for m in res.meals:
        assert len(m.items) >= 1
        for it in m.items:
            assert it.grams > 0 and it.grams % 5 == 0
    assert res.nutrient_totals["protein"] >= 40 - 1e-6


def test_impossible_b12_returns_useful_diagnostics():
    # Only vegan foods with no B12 source; require B12 minimum -> infeasible.
    vegan = [f for f in BASE_FOODS if "vegan" in f.tags or f.id in ("berries",)]
    req = base_request(
        foods=vegan,
        nutrient_constraints=[
            NutrientConstraint(key="vitamin_b12", mode=NutrientMode.MINIMUM, min=2.4),
        ],
    )
    res = solve(req)
    assert res.status == SolveStatus.INFEASIBLE
    assert res.feasible is False
    assert res.infeasibility is not None
    assert "vitamin_b12" in res.diagnostics.binding_constraints
    assert any(v.key == "vitamin_b12" for v in res.infeasibility.violations)


def test_banned_food_never_selected():
    res = solve(base_request(banned_food_ids=["salmon"]))
    assert res.feasible
    selected = {it.food_id for m in res.meals for it in m.items}
    assert "salmon" not in selected


def test_same_seed_is_deterministic():
    a = solve(base_request(seed=7))
    b = solve(base_request(seed=7))
    da = sorted((m.role, it.food_id, it.grams) for m in a.meals for it in m.items)
    db = sorted((m.role, it.food_id, it.grams) for m in b.meals for it in m.items)
    assert da == db
    assert a.objective_score == b.objective_score


def test_locked_food_remains_present():
    req = base_request(locked_ingredients=[LockedIngredient(food_id="oats", meal_role="BREAKFAST", grams=150)])
    res = solve(req)
    assert res.feasible
    bfast = next(m for m in res.meals if m.role == "BREAKFAST")
    oats = [it for it in bfast.items if it.food_id == "oats"]
    assert oats and oats[0].grams == 150


def test_timeout_is_not_infeasible():
    # A tiny time budget must never be reported as INFEASIBLE.
    res = solve(base_request(time_budget_sec=0.1))
    assert res.status != SolveStatus.INFEASIBLE


def test_diagnostic_mode_reports_violations_directly():
    req = base_request(
        foods=[f for f in BASE_FOODS if "vegan" in f.tags],
        nutrient_constraints=[NutrientConstraint(key="vitamin_b12", mode=NutrientMode.MINIMUM, min=2.4)],
        mode=SolveMode.DIAGNOSTIC,
    )
    res = solve(req)
    assert res.infeasibility is not None
    assert any(v.kind == "under" and v.key == "vitamin_b12" for v in res.infeasibility.violations)
