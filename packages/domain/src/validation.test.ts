import { describe, expect, it } from "vitest";
import {
  DEFAULT_ADULT_GOALS,
  NUTRIENT_CATALOG,
  findDuplicateNutrientKeys,
  isGoalValid,
  validateGoal,
} from "./index";

describe("nutrient catalog", () => {
  it("has 21 entries with unique keys", () => {
    expect(NUTRIENT_CATALOG).toHaveLength(21);
    expect(findDuplicateNutrientKeys(NUTRIENT_CATALOG.map((n) => n.key))).toEqual([]);
  });
  it("EPA+DHA sums two FDC nutrient numbers", () => {
    const epa = NUTRIENT_CATALOG.find((n) => n.key === "omega3_epa_dha");
    expect(epa?.fdc).toEqual([1278, 1272]);
  });
});

describe("goal validation", () => {
  it("accepts every default adult goal", () => {
    for (const g of DEFAULT_ADULT_GOALS) {
      expect(validateGoal(g), `${g.nutrientKey}`).toEqual([]);
    }
  });
  it("enforces min <= target <= max", () => {
    expect(isGoalValid({ nutrientKey: "iron", mode: "TARGET", min: 10, target: 5, max: 20 })).toBe(false);
    expect(isGoalValid({ nutrientKey: "iron", mode: "TARGET", min: 5, target: 10, max: 20 })).toBe(true);
  });
  it("DISABLED must carry no bounds (not a maximum of 0)", () => {
    expect(validateGoal({ nutrientKey: "iron", mode: "DISABLED" })).toEqual([]);
    expect(isGoalValid({ nutrientKey: "iron", mode: "DISABLED", max: 0 })).toBe(false);
  });
  it("MAXIMUM of 0 is a valid, distinct configuration", () => {
    expect(validateGoal({ nutrientKey: "iron", mode: "MAXIMUM", max: 0 })).toEqual([]);
  });
  it("rejects a wrong unit for a nutrient", () => {
    expect(isGoalValid({ nutrientKey: "iron", mode: "TARGET", target: 18, unit: "mcg" })).toBe(false);
    expect(isGoalValid({ nutrientKey: "iron", mode: "TARGET", target: 18, unit: "mg" })).toBe(true);
  });
  it("rejects an unknown nutrient key", () => {
    expect(isGoalValid({ nutrientKey: "made_up", mode: "MINIMUM", min: 1 })).toBe(false);
  });
  it("requires the bound implied by the mode", () => {
    expect(isGoalValid({ nutrientKey: "iron", mode: "MINIMUM" })).toBe(false);
    expect(isGoalValid({ nutrientKey: "iron", mode: "MAXIMUM" })).toBe(false);
  });
});
