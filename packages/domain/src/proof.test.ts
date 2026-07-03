import { describe, expect, it } from "vitest";
import {
  aggregateNutrient,
  buildDayProof,
  buildNutrientProof,
  evaluateStatus,
  type GoalConfig,
  type IngredientInput,
  type MealInput,
} from "./index";

function ing(
  foodId: string,
  foodName: string,
  grams: number,
  nutrients: { key: string; per100g: number | null; unit: string; missing?: boolean }[],
  fdcId?: number,
): IngredientInput {
  return {
    foodId,
    foodName,
    grams,
    source: fdcId ? { fdcId, dataset: "SR Legacy" } : undefined,
    nutrients: nutrients.map((n) => ({
      key: n.key as IngredientInput["nutrients"][number]["key"],
      per100g: n.per100g,
      unit: n.unit,
      dataQuality: n.missing ? "MISSING" : "KNOWN",
      nutrientSourceId: "1003",
    })),
  };
}

// A fixed sample day: oats (breakfast) + salmon (dinner).
const oats = ing("oats", "Oats, cooked", 200, [
  { key: "protein", per100g: 2.5, unit: "g" },
  { key: "iron", per100g: 0.9, unit: "mg" },
], 168421);
const salmon = ing("salmon", "Salmon, cooked", 150, [
  { key: "protein", per100g: 22, unit: "g" },
  { key: "iron", per100g: 0.5, unit: "mg" },
  { key: "iodine", per100g: null, unit: "mcg", missing: true },
], 173722);
const meals: MealInput[] = [
  { role: "BREAKFAST", ingredients: [oats] },
  { role: "DINNER", ingredients: [salmon] },
];

describe("aggregateNutrient", () => {
  it("sums known contributions without rounding", () => {
    const agg = aggregateNutrient("protein", [oats, salmon]);
    // 2.5*200/100 + 22*150/100 = 5 + 33 = 38
    expect(agg.known).toBe(38);
    expect(agg.hasMissing).toBe(false);
    expect(agg.contributors[0]!.foodName).toBe("Salmon, cooked"); // largest first
    expect(agg.contributors[0]!.pctOfTotal).toBeCloseTo((33 / 38) * 100, 6);
  });

  it("flags missing contributors and never coerces them to zero", () => {
    const agg = aggregateNutrient("iodine", [oats, salmon]);
    expect(agg.anyKnown).toBe(false);
    expect(agg.hasMissing).toBe(true);
    expect(agg.contributors.some((c) => c.amount === null)).toBe(true);
  });
});

describe("golden proof — sample day reconciles exactly with raw calc", () => {
  const goals: GoalConfig[] = [
    { key: "protein", mode: "MINIMUM", unit: "g", min: 30 },
    { key: "iron", mode: "TARGET", unit: "mg", target: 18, toleranceLowPct: 10, toleranceHighPct: 10 },
  ];
  const proof = buildDayProof(goals, meals);
  const protein = proof.find((p) => p.nutrientKey === "protein")!;
  const iron = proof.find((p) => p.nutrientKey === "iron")!;

  it("protein: 38 g, known >= 30 => MET, 126.6% of min", () => {
    expect(protein.consumed).toBe(38);
    expect(protein.status).toBe("MET");
    expect(protein.percentOfTarget).toBeCloseTo((38 / 30) * 100, 6);
    expect(protein.confidence).toBe("COMPLETE");
  });

  it("iron: 0.9*2 + 0.5*1.5 = 1.8 + 0.75 = 2.55 mg, well under 18 => UNDER", () => {
    expect(iron.consumed).toBeCloseTo(2.55, 6);
    expect(iron.status).toBe("UNDER");
  });

  it("carries source provenance for each contributor", () => {
    expect(protein.sources.map((s) => s.fdcId).sort()).toEqual([168421, 173722]);
  });
});

describe("missing data honesty (invariant 4)", () => {
  const goalMinWithMissing: GoalConfig = { key: "iodine", mode: "MINIMUM", unit: "mcg", min: 150 };
  it("all-missing minimum => UNKNOWN, confidence MISSING, consumed null", () => {
    const p = buildNutrientProof(goalMinWithMissing, [salmon]);
    expect(p.status).toBe("UNKNOWN");
    expect(p.confidence).toBe("MISSING");
    expect(p.consumed).toBeNull();
    expect(p.percentOfTarget).toBeNull();
  });

  it("TARGET with a missing contributor can never be MET", () => {
    const partial = ing("mix", "Mix", 100, [
      { key: "iron", per100g: 10, unit: "mg" },
    ]);
    const missing = ing("x", "X", 100, [{ key: "iron", per100g: null, unit: "mg", missing: true }]);
    const goal: GoalConfig = { key: "iron", mode: "TARGET", unit: "mg", target: 12, toleranceLowPct: 10, toleranceHighPct: 10 };
    const p = buildNutrientProof(goal, [partial, missing]);
    expect(p.status).toBe("UNKNOWN"); // 10 known within band, but missing could break it
    expect(p.confidence).toBe("PARTIAL");
  });

  it("MINIMUM already met by known data stays MET despite missing extra", () => {
    const known = ing("a", "A", 100, [{ key: "protein", per100g: 40, unit: "g" }]);
    const missing = ing("b", "B", 100, [{ key: "protein", per100g: null, unit: "g", missing: true }]);
    const goal: GoalConfig = { key: "protein", mode: "MINIMUM", unit: "g", min: 30 };
    expect(buildNutrientProof(goal, [known, missing]).status).toBe("MET");
  });
});

describe("property — linear scaling: doubling grams doubles known nutrients", () => {
  it("scales exactly across many gram values", () => {
    const goal: GoalConfig = { key: "protein", mode: "MINIMUM", unit: "g", min: 0 };
    for (const grams of [10, 33.3, 100, 250, 512.75]) {
      const single = buildNutrientProof(goal, [ing("f", "F", grams, [{ key: "protein", per100g: 7, unit: "g" }])]);
      const doubled = buildNutrientProof(goal, [ing("f", "F", grams * 2, [{ key: "protein", per100g: 7, unit: "g" }])]);
      expect(doubled.consumed!).toBeCloseTo(single.consumed! * 2, 9);
    }
  });
});

describe("evaluateStatus — MAXIMUM with missing", () => {
  it("known over max => OVER even with missing; known under + missing => UNKNOWN", () => {
    const overAgg = aggregateNutrient("fat", [ing("a", "A", 100, [{ key: "fat", per100g: 100, unit: "g" }])]);
    expect(evaluateStatus(overAgg, { key: "fat", mode: "MAXIMUM", unit: "g", max: 50 })).toBe("OVER");
    const underMissing = aggregateNutrient("fat", [
      ing("a", "A", 100, [{ key: "fat", per100g: 10, unit: "g" }]),
      ing("b", "B", 100, [{ key: "fat", per100g: null, unit: "g", missing: true }]),
    ]);
    expect(evaluateStatus(underMissing, { key: "fat", mode: "MAXIMUM", unit: "g", max: 50 })).toBe("UNKNOWN");
  });
});

describe("proof-table snapshot", () => {
  it("matches the stable proof shape", () => {
    const goals: GoalConfig[] = [
      { key: "protein", mode: "MINIMUM", unit: "g", min: 30 },
      { key: "iron", mode: "TARGET", unit: "mg", target: 18 },
      { key: "iodine", mode: "TARGET", unit: "mcg", target: 150 },
    ];
    expect(buildDayProof(goals, meals)).toMatchSnapshot();
  });
});
