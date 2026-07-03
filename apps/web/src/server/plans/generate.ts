import "server-only";
import type { PrismaClient } from "@goodfood/db";
import type { NutrientConstraint, SolveRequest, SolverClient } from "@goodfood/api-client";
import {
  buildDayProof,
  CANONICAL_UNIT,
  reconcileTotals,
  type GoalConfig,
  type IngredientInput,
  type MealInput,
  type NutrientKey,
  type NutrientProof,
} from "@goodfood/domain";
import { selectCandidates, type BanRule, type FoodRow } from "./candidates";
import type { GenerateSettings } from "./settings";

export class ProofMismatchError extends Error {
  constructor(public mismatches: unknown[]) {
    super("Solver output failed independent proof verification");
    this.name = "ProofMismatchError";
  }
}

interface LoadedGoals {
  solverConstraints: NutrientConstraint[];
  proofGoals: GoalConfig[];
}

async function loadGoals(prisma: PrismaClient, settings: GenerateSettings): Promise<LoadedGoals> {
  const profile = settings.recommendationProfileId
    ? await prisma.recommendationProfile.findUnique({
        where: { id: settings.recommendationProfileId },
        include: { goals: true },
      })
    : await prisma.recommendationProfile.findFirst({
        where: { isDefault: true },
        include: { goals: true },
      });

  const merged = new Map<string, GoalConfig>();
  for (const g of profile?.goals ?? []) {
    merged.set(g.nutrientKey, {
      key: g.nutrientKey as NutrientKey,
      mode: g.mode,
      unit: CANONICAL_UNIT[g.nutrientKey as NutrientKey] ?? "",
      min: g.minAmount ? Number(g.minAmount) : null,
      target: g.targetAmount ? Number(g.targetAmount) : null,
      max: g.maxAmount ? Number(g.maxAmount) : null,
      toleranceLowPct: g.toleranceLowPct ? Number(g.toleranceLowPct) : null,
      toleranceHighPct: g.toleranceHighPct ? Number(g.toleranceHighPct) : null,
    });
  }
  for (const o of settings.goalOverrides) {
    merged.set(o.key, {
      key: o.key as NutrientKey,
      mode: o.mode,
      unit: CANONICAL_UNIT[o.key as NutrientKey] ?? "",
      min: o.min ?? null,
      target: o.target ?? null,
      max: o.max ?? null,
    });
  }

  const enabled = [...merged.values()].filter((g) => g.mode !== "DISABLED");
  const solverConstraints: NutrientConstraint[] = enabled.map((g) => ({
    key: g.key,
    mode: g.mode,
    min: g.min ?? null,
    target: g.target ?? null,
    max: g.max ?? null,
    tolerance_low_pct: g.toleranceLowPct ?? 10,
    tolerance_high_pct: g.toleranceHighPct ?? 10,
  }));
  return { solverConstraints, proofGoals: enabled };
}

async function fetchFoodRows(prisma: PrismaClient, settings: GenerateSettings): Promise<FoodRow[]> {
  const pantry = await prisma.pantryItem.findMany({
    where: { userId: settings.userId, availability: { not: "UNAVAILABLE" } },
    include: { food: { include: { nutrients: true, tags: true } } },
  });
  const pantryRows: FoodRow[] = pantry.map((p) => ({
    id: p.food.id,
    name: p.food.name,
    foodCategory: p.food.foodCategory,
    tags: p.food.tags.map((t) => t.tag),
    nutrients: p.food.nutrients.map((n) => ({
      nutrientKey: n.nutrientKey,
      amountPer100g: n.amountPer100g ? Number(n.amountPer100g) : null,
      dataQuality: n.dataQuality,
      unit: n.unit,
    })),
    isPantry: true,
    pantryGrams: p.quantityGrams ? Number(p.quantityGrams) : null,
    fdcId: p.food.fdcId,
    dataset: p.food.sourceDataset,
  }));

  if (settings.pantryMode === "PANTRY_ONLY") return pantryRows;

  const pantryIds = new Set(pantryRows.map((r) => r.id));
  const catalog = await prisma.food.findMany({
    where: { source: { in: ["USDA_FOUNDATION", "USDA_SR_LEGACY", "SYNTHETIC"] } },
    include: { nutrients: true, tags: true },
    take: 300,
  });
  const catalogRows: FoodRow[] = catalog
    .filter((f) => !pantryIds.has(f.id))
    .map((f) => ({
      id: f.id,
      name: f.name,
      foodCategory: f.foodCategory,
      tags: f.tags.map((t) => t.tag),
      nutrients: f.nutrients.map((n) => ({
        nutrientKey: n.nutrientKey,
        amountPer100g: n.amountPer100g ? Number(n.amountPer100g) : null,
        dataQuality: n.dataQuality,
        unit: n.unit,
      })),
      isPantry: false,
      fdcId: f.fdcId,
      dataset: f.sourceDataset,
    }));
  return [...pantryRows, ...catalogRows];
}

function ingredientNutrients(row: FoodRow, goals: GoalConfig[]): IngredientInput["nutrients"] {
  return goals.map((g) => {
    const n = row.nutrients.find((x) => x.nutrientKey === g.key);
    if (!n || n.amountPer100g === null) {
      return { key: g.key, per100g: null, unit: g.unit, dataQuality: "MISSING" as const };
    }
    return {
      key: g.key,
      per100g: n.amountPer100g,
      unit: n.unit,
      dataQuality: n.dataQuality as IngredientInput["nutrients"][number]["dataQuality"],
    };
  });
}

export interface GenerateOutput {
  planId: string | null;
  feasible: boolean;
  status: string;
  meals: { role: string; items: { foodId: string; foodName: string; grams: number; fromPantry: boolean }[] }[];
  proof: NutrientProof[];
  warnings: string[];
  diagnostics: unknown;
  infeasibility?: unknown;
}

/** Full generate flow: candidates -> solver -> independent proof verify -> persist. */
export async function generatePlan(
  prisma: PrismaClient,
  solver: SolverClient,
  settings: GenerateSettings,
): Promise<GenerateOutput> {
  const warnings: string[] = [];
  const { solverConstraints, proofGoals } = await loadGoals(prisma, settings);
  const foodRows = await fetchFoodRows(prisma, settings);
  const rowById = new Map(foodRows.map((r) => [r.id, r]));

  const bans: BanRule[] = (
    await prisma.foodBan.findMany({ where: { userId: settings.userId } })
  ).map((b) => ({ foodId: b.foodId, tag: b.tag }));
  const presets = (
    await prisma.dietaryPreference.findMany({ where: { userId: settings.userId } })
  ).map((d) => d.preset);
  const { dietExcludedTags } = await import("./candidates");

  const { candidates, excluded } = selectCandidates(
    foodRows,
    proofGoals.map((g) => ({ key: g.key, target: g.target ?? g.min ?? null })),
    {
      mealRoles: settings.mealRoles,
      maxCandidates: settings.maxCandidates,
      bans,
      dietTags: dietExcludedTags(presets),
    },
  );
  if (excluded.length) warnings.push(`${excluded.length} foods excluded by bans/diet`);
  if (candidates.length === 0) throw new Error("No eligible candidate foods for these settings");

  const solveReq: SolveRequest = {
    foods: candidates,
    meals: settings.mealRoles.map((role) => ({ role, required: true, template_tags: [], max_total_grams: null })),
    nutrient_constraints: solverConstraints,
    banned_food_ids: bans.map((b) => b.foodId).filter((x): x is string => Boolean(x)),
    locked_ingredients: [],
    gram_increment: 10,
    seed: settings.seed,
    time_budget_sec: 8,
    mode: "strict",
  };

  const result = await solver.solve(solveReq);

  if (!result.feasible || !result.meals) {
    return {
      planId: null,
      feasible: false,
      status: result.status,
      meals: [],
      proof: [],
      warnings,
      diagnostics: result.diagnostics,
      infeasibility: result.infeasibility,
    };
  }

  // Build meals of IngredientInputs for the independent TS proof.
  const mealInputs: MealInput[] = result.meals.map((m) => ({
    role: m.role,
    ingredients: (m.items ?? []).map((it) => {
      const row = rowById.get(it.food_id)!;
      return {
        foodId: it.food_id,
        foodName: it.name,
        grams: it.grams,
        source: { fdcId: row.fdcId ?? null, dataset: row.dataset ?? null },
        nutrients: ingredientNutrients(row, proofGoals),
      } satisfies IngredientInput;
    }),
  }));

  const proof = buildDayProof(proofGoals, mealInputs);

  // Independent verification — reject solver output that disagrees with the proof.
  const solverTotals: Record<string, number> = result.nutrient_totals ?? {};
  const reconc = reconcileTotals(proof, solverTotals, 2);
  if (!reconc.ok) throw new ProofMismatchError(reconc.mismatches);

  // Persist plan + immutable revision snapshot.
  const planId = await persistPlan(prisma, settings, mealInputs, proof, result, solveReq);

  return {
    planId,
    feasible: true,
    status: result.status,
    meals: mealInputs.map((m) => ({
      role: m.role,
      items: m.ingredients.map((i) => ({
        foodId: i.foodId,
        foodName: i.foodName,
        grams: i.grams,
        fromPantry: rowById.get(i.foodId)?.isPantry ?? false,
      })),
    })),
    proof,
    warnings,
    diagnostics: result.diagnostics,
  };
}

async function persistPlan(
  prisma: PrismaClient,
  settings: GenerateSettings,
  meals: MealInput[],
  proof: NutrientProof[],
  result: Awaited<ReturnType<SolverClient["solve"]>>,
  solveReq: SolveRequest,
): Promise<string> {
  const snapshotJson = {
    ingredients: meals.flatMap((m) =>
      m.ingredients.map((i) => ({
        role: m.role,
        foodId: i.foodId,
        foodName: i.foodName,
        grams: i.grams,
        per100g: Object.fromEntries(i.nutrients.map((n) => [n.key, n.per100g])),
        source: i.source,
      })),
    ),
  };

  return prisma.$transaction(async (tx) => {
    const plan = await tx.mealPlan.create({
      data: {
        userId: settings.userId,
        name: settings.name,
        durationDays: settings.durationDays,
        status: "DRAFT",
        pantryMode: settings.pantryMode,
        recommendationProfileId: settings.recommendationProfileId ?? null,
        seed: BigInt(settings.seed),
        settings: { mealRoles: settings.mealRoles, maxCandidates: settings.maxCandidates },
        days: {
          create: [
            {
              dayIndex: 0,
              meals: {
                create: meals.map((m, mi) => ({
                  role: m.role as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
                  sequence: mi,
                  ingredients: {
                    create: m.ingredients.map((i, ii) => ({
                      foodId: i.foodId,
                      grams: i.grams,
                      sequence: ii,
                      fromPantry: false,
                    })),
                  },
                })),
              },
            },
          ],
        },
      },
    });

    const solverRun = await tx.solverRun.create({
      data: {
        mealPlanId: plan.id,
        mode: "STRICT",
        status: result.status as "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "TIME_LIMIT" | "ERROR",
        seed: BigInt(settings.seed),
        objectiveScore: result.objective_score ?? null,
        durationMs: result.solve_time_ms ?? null,
        request: solveReq as object,
        response: result as object,
        diagnostics: (result.diagnostics ?? null) as object,
      },
    });

    await tx.planRevision.create({
      data: {
        mealPlanId: plan.id,
        revisionNumber: 1,
        reason: "generate",
        snapshotJson,
        solverRunId: solverRun.id,
        createdByUserId: settings.userId,
        nutrientSnapshots: {
          create: proof.map((p) => ({
            scope: "DAY" as const,
            dayIndex: 0,
            nutrientKey: p.nutrientKey,
            mode: p.mode,
            minAmount: p.min,
            targetAmount: p.target,
            maxAmount: p.max,
            consumedAmount: p.consumed,
            unit: p.unit,
            percentOfTarget: p.percentOfTarget,
            status: p.status,
            confidence: p.confidence,
          })),
        },
      },
    });

    return plan.id;
  });
}
