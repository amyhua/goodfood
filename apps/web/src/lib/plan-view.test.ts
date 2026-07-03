import { describe, expect, it } from "vitest";
import { aggregateShopping, buildSamplePlan, serializedToPlanView } from "./plan-view";

describe("buildSamplePlan", () => {
  const plan = buildSamplePlan();

  it("is flagged as sample and has a single day of meals", () => {
    expect(plan.isSample).toBe(true);
    expect(plan.days).toHaveLength(1);
    expect(plan.days[0]!.meals.map((m) => m.role)).toEqual(["BREAKFAST", "LUNCH", "DINNER"]);
  });

  it("reports missing nutrients as unknown, never zero (invariant 4)", () => {
    // No synthetic food supplies iodine or choline → must be UNKNOWN + null consumed.
    for (const key of ["iodine", "choline"]) {
      const row = plan.proof.find((r) => r.nutrientKey === key);
      expect(row, key).toBeDefined();
      expect(row!.consumed).toBeNull();
      expect(row!.status).toBe("UNKNOWN");
      expect(row!.confidence).toBe("MISSING");
    }
  });

  it("computes a real energy total from known contributors", () => {
    const energy = plan.proof.find((r) => r.nutrientKey === "energy");
    expect(energy).toBeDefined();
    expect(energy!.consumed).toBeGreaterThan(0);
    expect(energy!.contributors.length).toBeGreaterThan(0);
  });

  it("orders proof rows by the canonical nutrient sort order", () => {
    expect(plan.proof[0]!.nutrientKey).toBe("energy");
    expect(plan.proof[1]!.nutrientKey).toBe("protein");
  });
});

describe("aggregateShopping", () => {
  it("collapses repeated foods and sums grams across meals", () => {
    const items = aggregateShopping(buildSamplePlan());
    // Kale appears in both lunch (150g) and dinner (100g) → one line, 250g.
    const kale = items.find((i) => i.foodName.includes("Kale"));
    expect(kale).toBeDefined();
    expect(kale!.grams).toBe(250);
    // One entry per distinct food.
    expect(new Set(items.map((i) => i.foodName)).size).toBe(items.length);
  });
});

describe("serializedToPlanView", () => {
  it("maps a persisted plan and dedupes proof rows per nutrient", () => {
    const view = serializedToPlanView({
      id: "p1",
      name: "My plan",
      durationDays: 1,
      days: [
        {
          dayIndex: 0,
          meals: [
            {
              role: "BREAKFAST",
              items: [
                { foodName: "Oats", grams: 100, fromPantry: false, locked: false, source: { fdcId: 123 } },
              ],
            },
          ],
        },
      ],
      proof: [
        { nutrientKey: "protein", mode: "MINIMUM", unit: "g", min: 46, target: null, max: null, consumed: 50, percentOfTarget: 108, status: "MET", confidence: "COMPLETE", dayIndex: 0 },
        { nutrientKey: "protein", mode: "MINIMUM", unit: "g", min: 46, target: null, max: null, consumed: 50, percentOfTarget: 108, status: "MET", confidence: "COMPLETE", dayIndex: 1 },
      ],
    });
    expect(view.isSample).toBe(false);
    expect(view.name).toBe("My plan");
    expect(view.proof.filter((r) => r.nutrientKey === "protein")).toHaveLength(1);
    expect(view.proof[0]!.displayName).toBe("Protein");
  });
});
