"""Pydantic contract for the goodfood solver (Prompt 5, GOO-21).

The solver returns SELECTIONS ONLY (foods + grams + diagnostics). TypeScript
(@goodfood/domain) remains the canonical nutrient-proof calculator.
"""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class NutrientMode(str, Enum):
    DISABLED = "DISABLED"
    MINIMUM = "MINIMUM"
    TARGET = "TARGET"
    MAXIMUM = "MAXIMUM"


class SolveMode(str, Enum):
    STRICT = "strict"
    DIAGNOSTIC = "diagnostic"


class SolveStatus(str, Enum):
    OPTIMAL = "OPTIMAL"
    FEASIBLE = "FEASIBLE"
    INFEASIBLE = "INFEASIBLE"
    TIME_LIMIT = "TIME_LIMIT"
    ERROR = "ERROR"


class CandidateFood(BaseModel):
    id: str
    name: str
    meal_roles: list[str] = Field(..., description="meal roles this food may appear in")
    per100g: dict[str, Optional[float]] = Field(
        default_factory=dict, description="nutrient key -> per-100g value; null == missing"
    )
    tags: list[str] = Field(default_factory=list)
    category: Optional[str] = None
    is_pantry: bool = False
    pantry_grams: Optional[float] = None
    min_grams: float = 0.0
    max_grams: float = 300.0


class MealSpec(BaseModel):
    role: str
    required: bool = True
    template_tags: list[str] = Field(
        default_factory=list, description="each tag must be covered by >=1 selected food"
    )
    max_total_grams: Optional[float] = None


class NutrientConstraint(BaseModel):
    key: str
    mode: NutrientMode
    min: Optional[float] = None
    target: Optional[float] = None
    max: Optional[float] = None
    tolerance_low_pct: float = 10.0
    tolerance_high_pct: float = 10.0


class LockedIngredient(BaseModel):
    food_id: str
    meal_role: str
    grams: float


class ObjectiveWeights(BaseModel):
    pantry: int = 100  # penalty per non-pantry food selected
    food_count: int = 10  # penalty per food selected
    deviation: int = 1  # penalty per unit of nutrient deviation


class SolveRequest(BaseModel):
    foods: list[CandidateFood]
    meals: list[MealSpec]
    nutrient_constraints: list[NutrientConstraint] = Field(default_factory=list)
    banned_food_ids: list[str] = Field(default_factory=list)
    locked_ingredients: list[LockedIngredient] = Field(default_factory=list)
    gram_increment: int = 5
    seed: int = 0
    time_budget_sec: float = 5.0
    mode: SolveMode = SolveMode.STRICT
    weights: ObjectiveWeights = Field(default_factory=ObjectiveWeights)


class SelectedItem(BaseModel):
    food_id: str
    name: str
    grams: float
    from_pantry: bool = False


class MealResult(BaseModel):
    role: str
    items: list[SelectedItem] = Field(default_factory=list)


class ConstraintViolation(BaseModel):
    key: str
    kind: str  # "under" | "over" | "meal_unfillable" | "template_uncovered"
    needed: Optional[float] = None
    achieved: Optional[float] = None
    suggestion: str


class Diagnostics(BaseModel):
    candidate_count: int
    selected_count: int
    binding_constraints: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class Infeasibility(BaseModel):
    explanation: str
    violations: list[ConstraintViolation] = Field(default_factory=list)


class SolveResponse(BaseModel):
    status: SolveStatus
    feasible: bool
    meals: list[MealResult] = Field(default_factory=list)
    nutrient_totals: dict[str, float] = Field(default_factory=dict)
    objective_score: Optional[float] = None
    solve_time_ms: int = 0
    seed: int = 0
    diagnostics: Diagnostics
    infeasibility: Optional[Infeasibility] = None
