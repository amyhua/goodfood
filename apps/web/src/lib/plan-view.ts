/**
 * UI-facing plan/proof view model (F1, GOO-24).
 *
 * A single shape the responsive planner, proof table, and shopping list all render,
 * built either from a *real* persisted plan (serializePlan) or from a deterministic,
 * clearly-labeled SAMPLE. The sample uses the domain's SYNTHETIC_FOODS (invariant 2:
 * fixtures are labeled synthetic, never presented as USDA-backed) run through the real
 * buildDayProof engine — so the proof math is honest and `missing !== zero` holds
 * without needing the live solver or a database.
 */
import {
  buildDayProof,
  CANONICAL_UNIT,
  DEFAULT_ADULT_GOALS,
  NUTRIENT_CATALOG,
  NUTRIENT_KEYS,
  SYNTHETIC_FOODS,
  type GoalConfig,
  type IngredientInput,
  type MealInput,
  type NutrientCategory,
  type NutrientKey,
} from "@goodfood/domain";

export interface ProofContributorView {
  foodName: string;
  grams: number;
  amount: number | null;
  unit: string;
  dataQuality: string;
  source?: { fdcId?: number | null; dataset?: string | null };
}

export interface ProofRow {
  nutrientKey: string;
  displayName: string;
  category: NutrientCategory;
  mode: string;
  unit: string;
  consumed: number | null;
  target: number | null;
  min: number | null;
  max: number | null;
  percentOfTarget: number | null;
  status: string;
  confidence: string;
  contributors: ProofContributorView[];
}

export interface MealItemView {
  foodName: string;
  grams: number | null;
  fromPantry: boolean;
  locked: boolean;
  source: { fdcId?: number | null; dataset?: string | null };
}

export interface MealView {
  role: string;
  items: MealItemView[];
}

export interface PlanView {
  id: string;
  name: string;
  durationDays: number;
  days: { dayIndex: number; meals: MealView[] }[];
  proof: ProofRow[];
  isSample: boolean;
}

const CATALOG_BY_KEY = new Map(NUTRIENT_CATALOG.map((n) => [n.key, n]));

/** Nutrient display metadata for a key, in canonical sort order. */
export function nutrientMeta(key: string) {
  return CATALOG_BY_KEY.get(key as NutrientKey);
}

// --------------------------- sample plan ---------------------------

function sampleIngredient(slug: string, grams: number): IngredientInput {
  const food = SYNTHETIC_FOODS.find((f) => f.slug === slug);
  if (!food) throw new Error(`unknown synthetic food ${slug}`);
  const nutrients = NUTRIENT_KEYS.map((key) => {
    const per100g = food.per100g[key];
    return {
      key,
      per100g: per100g ?? null, // absent => MISSING, never 0 (invariant 4)
      unit: CANONICAL_UNIT[key],
      dataQuality: per100g == null ? ("MISSING" as const) : ("KNOWN" as const),
    };
  });
  return {
    foodId: food.slug,
    foodName: food.name,
    grams,
    nutrients,
    source: { dataset: "SYNTHETIC" },
  };
}

const SAMPLE_MEALS: MealInput[] = [
  { role: "BREAKFAST", ingredients: [sampleIngredient("synthetic-oats", 250)] },
  {
    role: "LUNCH",
    ingredients: [sampleIngredient("synthetic-tofu", 200), sampleIngredient("synthetic-kale", 150)],
  },
  {
    role: "DINNER",
    ingredients: [sampleIngredient("synthetic-salmon", 180), sampleIngredient("synthetic-kale", 100)],
  },
];

function goalConfigs(): GoalConfig[] {
  return DEFAULT_ADULT_GOALS.map((g) => ({
    key: g.nutrientKey,
    mode: g.mode,
    unit: CANONICAL_UNIT[g.nutrientKey],
    min: g.min ?? null,
    target: g.target ?? null,
    max: g.max ?? null,
    toleranceLowPct: g.toleranceLowPct ?? null,
    toleranceHighPct: g.toleranceHighPct ?? null,
  }));
}

/** Deterministic, honest sample plan for the planner UI and Playwright. */
export function buildSamplePlan(): PlanView {
  const proofs = buildDayProof(goalConfigs(), SAMPLE_MEALS);
  const proof: ProofRow[] = proofs
    .map((p): ProofRow => {
      const meta = CATALOG_BY_KEY.get(p.nutrientKey);
      return {
        nutrientKey: p.nutrientKey,
        displayName: meta?.displayName ?? p.nutrientKey,
        category: meta?.category ?? "OTHER",
        mode: p.mode,
        unit: p.unit,
        consumed: p.consumed,
        target: p.target,
        min: p.min,
        max: p.max,
        percentOfTarget: p.percentOfTarget,
        status: p.status,
        confidence: p.confidence,
        contributors: p.contributors.map((c) => ({
          foodName: c.foodName,
          grams: c.grams,
          amount: c.amount,
          unit: c.unit,
          dataQuality: c.dataQuality,
          source: c.source,
        })),
      };
    })
    .sort(
      (a, b) =>
        (CATALOG_BY_KEY.get(a.nutrientKey as NutrientKey)?.sortOrder ?? 99) -
        (CATALOG_BY_KEY.get(b.nutrientKey as NutrientKey)?.sortOrder ?? 99),
    );

  const days = [
    {
      dayIndex: 0,
      meals: SAMPLE_MEALS.map((m) => ({
        role: m.role,
        items: m.ingredients.map((i) => ({
          foodName: i.foodName,
          grams: i.grams,
          fromPantry: false,
          locked: false,
          source: { dataset: "SYNTHETIC" as const },
        })),
      })),
    },
  ];

  return {
    id: "sample",
    name: "Sample day plan",
    durationDays: 1,
    days,
    proof,
    isSample: true,
  };
}

// --------------------------- shopping list ---------------------------

export interface ShoppingItem {
  foodName: string;
  grams: number | null;
  category: string;
  source: { fdcId?: number | null; dataset?: string | null };
}

const CATEGORY_BY_NAME = new Map(SYNTHETIC_FOODS.map((f) => [f.name, f.foodCategory]));

/**
 * Aggregate a plan's ingredients into a shopping list: one line per food, grams
 * summed across every meal and day, grouped by food category. Grams stay null when
 * unknown (never coerced to 0). Pantry subtraction happens client-side (F1 pantry
 * is local); DB-backed pantry is a later stream.
 */
export function aggregateShopping(plan: PlanView): ShoppingItem[] {
  const byName = new Map<string, ShoppingItem>();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        const existing = byName.get(item.foodName);
        if (existing) {
          existing.grams =
            existing.grams == null || item.grams == null ? existing.grams ?? item.grams : existing.grams + item.grams;
        } else {
          byName.set(item.foodName, {
            foodName: item.foodName,
            grams: item.grams,
            category: CATEGORY_BY_NAME.get(item.foodName) ?? "Other",
            source: item.source,
          });
        }
      }
    }
  }
  return [...byName.values()].sort(
    (a, b) => a.category.localeCompare(b.category) || a.foodName.localeCompare(b.foodName),
  );
}

// --------------------------- share highlights ---------------------------

export interface PlanHighlights {
  metCount: number;
  activeCount: number;
  energyText: string;
  summary: string;
}

/** Honest one-line highlight for share cards/OG images. Only MET counts as met; missing
 *  data never inflates the number (invariant 4). */
export function planHighlights(plan: PlanView): PlanHighlights {
  const active = plan.proof.filter((r) => r.mode !== "DISABLED");
  const metCount = active.filter((r) => r.status === "MET").length;
  const energy = plan.proof.find((r) => r.nutrientKey === "energy");
  const energyText = energy && energy.consumed != null ? `${Math.round(energy.consumed)} kcal` : "energy n/a";
  return {
    metCount,
    activeCount: active.length,
    energyText,
    summary: `${metCount}/${active.length} nutrient targets met · ${energyText}`,
  };
}

export function listHighlights(items: ShoppingItem[]): { itemCount: number; categoryCount: number; summary: string } {
  const categoryCount = new Set(items.map((i) => i.category)).size;
  return {
    itemCount: items.length,
    categoryCount,
    summary: `${items.length} items · ${categoryCount} categories`,
  };
}

// --------------------------- real plan ---------------------------

/** Structural shape of `serializePlan(...)` output (kept pure — no server-only import). */
export interface SerializedPlan {
  id: string;
  name: string;
  durationDays: number;
  days: {
    dayIndex: number;
    meals: {
      role: string;
      locked?: boolean;
      items: {
        foodName: string;
        grams: number | null;
        fromPantry: boolean;
        locked: boolean;
        source: { fdcId?: number | null; dataset?: string | null };
      }[];
    }[];
  }[];
  proof: {
    nutrientKey: string;
    mode: string;
    unit: string;
    min: number | null;
    target: number | null;
    max: number | null;
    consumed: number | null;
    percentOfTarget: number | null;
    status: string;
    confidence: string;
    dayIndex: number | null;
  }[];
}

/** Map a persisted, serialized plan to the shared view model (F1 real-plan path). */
export function serializedToPlanView(p: SerializedPlan): PlanView {
  const seen = new Set<string>();
  const proof: ProofRow[] = [];
  for (const s of p.proof) {
    if (seen.has(s.nutrientKey)) continue; // one row per nutrient (day 0 / rollup)
    seen.add(s.nutrientKey);
    const meta = CATALOG_BY_KEY.get(s.nutrientKey as NutrientKey);
    proof.push({
      nutrientKey: s.nutrientKey,
      displayName: meta?.displayName ?? s.nutrientKey,
      category: meta?.category ?? "OTHER",
      mode: s.mode,
      unit: s.unit,
      consumed: s.consumed,
      target: s.target,
      min: s.min,
      max: s.max,
      percentOfTarget: s.percentOfTarget,
      status: s.status,
      confidence: s.confidence,
      contributors: [],
    });
  }
  proof.sort(
    (a, b) =>
      (CATALOG_BY_KEY.get(a.nutrientKey as NutrientKey)?.sortOrder ?? 99) -
      (CATALOG_BY_KEY.get(b.nutrientKey as NutrientKey)?.sortOrder ?? 99),
  );
  return {
    id: p.id,
    name: p.name,
    durationDays: p.durationDays,
    days: p.days.map((d) => ({
      dayIndex: d.dayIndex,
      meals: d.meals.map((m) => ({
        role: m.role,
        items: m.items.map((i) => ({
          foodName: i.foodName,
          grams: i.grams,
          fromPantry: i.fromPantry,
          locked: i.locked,
          source: i.source,
        })),
      })),
    })),
    proof,
    isSample: false,
  };
}
