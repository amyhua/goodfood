/**
 * Nutrition proof engine (Prompt 4, GOO-20) — pure, dependency-light.
 * The canonical calculator: solver returns selections, THIS computes the proof.
 *
 * Rules (docs/product-spec.md §3, invariants 4/6):
 *  - Never round before calculating; callers round only for display.
 *  - Preserve raw values; compute display separately (formatAmount).
 *  - Missing contributing data propagates as UNKNOWN — a target is never "met"
 *    on the strength of missing data.
 */
import { scalePer100g, type DataQuality, type NutrientKey, type NutrientMode } from "./index";

// ------------------------------- inputs -------------------------------

export interface IngredientNutrient {
  key: NutrientKey;
  per100g: number | null; // null == MISSING
  unit: string;
  dataQuality: DataQuality;
  nutrientSourceId?: string | null;
}

export interface IngredientInput {
  foodId: string;
  foodName: string;
  grams: number;
  nutrients: IngredientNutrient[];
  source?: { fdcId?: number | null; dataset?: string | null };
}

export interface MealInput {
  role: string;
  ingredients: IngredientInput[];
}

export interface GoalConfig {
  key: NutrientKey;
  mode: NutrientMode;
  unit: string;
  min?: number | null;
  target?: number | null;
  max?: number | null;
  toleranceLowPct?: number | null;
  toleranceHighPct?: number | null;
}

// ------------------------------- outputs -------------------------------

export type ProofStatus = "MET" | "UNDER" | "OVER" | "UNKNOWN";
export type ProofConfidence = "COMPLETE" | "PARTIAL" | "MISSING";

export interface Contributor {
  foodId: string;
  foodName: string;
  grams: number;
  amount: number | null; // contribution to this nutrient (raw)
  unit: string;
  dataQuality: DataQuality;
  pctOfTotal: number | null;
  source?: { fdcId?: number | null; dataset?: string | null };
}

export interface NutrientProof {
  nutrientKey: NutrientKey;
  mode: NutrientMode;
  unit: string;
  target: number | null;
  min: number | null;
  max: number | null;
  /** Raw consumed amount (known contributions only); null when all missing. */
  consumed: number | null;
  /** Percent of the primary reference (target|min|max); null when not computable. */
  percentOfTarget: number | null;
  status: ProofStatus;
  confidence: ProofConfidence;
  contributors: Contributor[];
  sources: { foodId: string; fdcId?: number | null; dataset?: string | null }[];
}

// ------------------------------- aggregation -------------------------------

export interface AggregatedNutrient {
  key: NutrientKey;
  unit: string;
  /** Sum of KNOWN contributions (raw, unrounded). */
  known: number;
  hasMissing: boolean;
  anyKnown: boolean;
  contributors: Contributor[];
}

/** Flatten meals into a single ingredient list (day/week aggregation reuse this). */
export function flattenIngredients(meals: MealInput[]): IngredientInput[] {
  return meals.flatMap((m) => m.ingredients);
}

/** Aggregate one nutrient across a list of ingredients. */
export function aggregateNutrient(
  key: NutrientKey,
  ingredients: IngredientInput[],
): AggregatedNutrient {
  let known = 0;
  let hasMissing = false;
  let anyKnown = false;
  let unit = "";
  const raw: Contributor[] = [];

  for (const ing of ingredients) {
    const n = ing.nutrients.find((x) => x.key === key);
    if (!n) continue;
    unit ||= n.unit;
    const amount = scalePer100g(n.per100g, ing.grams);
    if (amount === null || n.dataQuality === "MISSING") {
      hasMissing = true;
      raw.push({
        foodId: ing.foodId,
        foodName: ing.foodName,
        grams: ing.grams,
        amount: null,
        unit: n.unit,
        dataQuality: "MISSING",
        pctOfTotal: null,
        source: ing.source,
      });
      continue;
    }
    anyKnown = true;
    known += amount;
    raw.push({
      foodId: ing.foodId,
      foodName: ing.foodName,
      grams: ing.grams,
      amount,
      unit: n.unit,
      dataQuality: n.dataQuality,
      pctOfTotal: null,
      source: ing.source,
    });
  }

  // Fill pctOfTotal now that we know the known total.
  const contributors = raw
    .map((c) => ({ ...c, pctOfTotal: c.amount !== null && known > 0 ? (c.amount / known) * 100 : null }))
    .sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1));

  return { key, unit: unit || "", known, hasMissing, anyKnown, contributors };
}

// ------------------------------- status evaluation -------------------------------

function toleranceBand(goal: GoalConfig): { lo: number | null; hi: number | null } {
  if (goal.target === null || goal.target === undefined) {
    return { lo: goal.min ?? null, hi: goal.max ?? null };
  }
  const lowPct = goal.toleranceLowPct ?? 10;
  const highPct = goal.toleranceHighPct ?? 10;
  const lo = goal.min ?? goal.target * (1 - lowPct / 100);
  const hi = goal.max ?? goal.target * (1 + highPct / 100);
  return { lo, hi };
}

/**
 * Evaluate status honestly. Missing data can never yield MET for a target/maximum
 * (the unknown remainder could break it). For a minimum, KNOWN >= min is genuinely
 * MET because missing data can only add more.
 */
export function evaluateStatus(agg: AggregatedNutrient, goal: GoalConfig): ProofStatus {
  if (goal.mode === "DISABLED") return "UNKNOWN";
  const allMissing = !agg.anyKnown;
  if (allMissing) return "UNKNOWN";

  switch (goal.mode) {
    case "MINIMUM": {
      const min = goal.min ?? 0;
      if (agg.known >= min) return "MET";
      return agg.hasMissing ? "UNKNOWN" : "UNDER";
    }
    case "MAXIMUM": {
      const max = goal.max ?? Infinity;
      if (agg.known > max) return "OVER";
      return agg.hasMissing ? "UNKNOWN" : "MET";
    }
    case "TARGET": {
      const { lo, hi } = toleranceBand(goal);
      if (agg.hasMissing) {
        // Known already over the ceiling is a definite OVER regardless of missing.
        if (hi !== null && agg.known > hi) return "OVER";
        return "UNKNOWN";
      }
      if (lo !== null && agg.known < lo) return "UNDER";
      if (hi !== null && agg.known > hi) return "OVER";
      return "MET";
    }
    default:
      return "UNKNOWN";
  }
}

export function confidenceOf(agg: AggregatedNutrient): ProofConfidence {
  if (!agg.anyKnown) return "MISSING";
  return agg.hasMissing ? "PARTIAL" : "COMPLETE";
}

// ------------------------------- proof assembly -------------------------------

function primaryReference(goal: GoalConfig): number | null {
  return goal.target ?? goal.min ?? goal.max ?? null;
}

/** Build the proof for one nutrient over a set of ingredients. */
export function buildNutrientProof(goal: GoalConfig, ingredients: IngredientInput[]): NutrientProof {
  const agg = aggregateNutrient(goal.key, ingredients);
  const consumed = agg.anyKnown ? agg.known : null;
  const ref = primaryReference(goal);
  const percentOfTarget = consumed !== null && ref !== null && ref > 0 ? (consumed / ref) * 100 : null;
  const sources = agg.contributors
    .filter((c) => c.source?.fdcId != null)
    .map((c) => ({ foodId: c.foodId, fdcId: c.source?.fdcId, dataset: c.source?.dataset }));

  return {
    nutrientKey: goal.key,
    mode: goal.mode,
    unit: goal.unit || agg.unit,
    target: goal.target ?? null,
    min: goal.min ?? null,
    max: goal.max ?? null,
    consumed,
    percentOfTarget,
    status: evaluateStatus(agg, goal),
    confidence: confidenceOf(agg),
    contributors: agg.contributors,
    sources,
  };
}

/** Full proof map for a day (or any ingredient set) across all configured goals. */
export function buildProof(goals: GoalConfig[], ingredients: IngredientInput[]): NutrientProof[] {
  return goals.map((g) => buildNutrientProof(g, ingredients));
}

/** Proof for a day given its meals. */
export function buildDayProof(goals: GoalConfig[], meals: MealInput[]): NutrientProof[] {
  return buildProof(goals, flattenIngredients(meals));
}

/** Proof for a week given per-day meal sets (aggregates across all days). */
export function buildWeekProof(goals: GoalConfig[], days: MealInput[][]): NutrientProof[] {
  return buildProof(goals, days.flatMap(flattenIngredients));
}
