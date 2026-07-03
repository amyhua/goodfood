import { describe, expect, it } from "vitest";
import { dietExcludedTags, isBanned, selectCandidates, type FoodRow } from "./candidates";

function row(id: string, tags: string[], protein: number | null, isPantry = false): FoodRow {
  return {
    id, name: id, foodCategory: null, tags, isPantry,
    nutrients: [{ nutrientKey: "protein", amountPer100g: protein, dataQuality: protein === null ? "MISSING" : "KNOWN", unit: "g" }],
  };
}

const foods = [
  row("salmon", ["fish", "animal"], 22),
  row("tofu", ["legume", "vegan"], 15),
  row("oats", ["grain", "vegan"], 2.5),
];
const goals = [{ key: "protein", target: 50 }];

describe("candidate selection", () => {
  it("excludes banned foods (invariant 7)", () => {
    expect(isBanned(foods[0]!, [{ foodId: "salmon" }])).toBe(true);
    const { candidates, excluded } = selectCandidates(foods, goals, {
      mealRoles: ["LUNCH"], maxCandidates: 10, bans: [{ foodId: "salmon" }], dietTags: new Set(),
    });
    expect(candidates.map((c) => c.id)).not.toContain("salmon");
    expect(excluded.some((e) => e.id === "salmon" && e.reason === "banned")).toBe(true);
  });

  it("excludes diet-incompatible foods by tag", () => {
    const dietTags = dietExcludedTags(["VEGAN"]);
    const { candidates } = selectCandidates(foods, goals, {
      mealRoles: ["LUNCH"], maxCandidates: 10, bans: [], dietTags,
    });
    expect(candidates.map((c) => c.id)).toEqual(expect.arrayContaining(["tofu", "oats"]));
    expect(candidates.map((c) => c.id)).not.toContain("salmon");
  });

  it("ranks by nutrient deficit and caps the pool", () => {
    const { candidates } = selectCandidates(foods, goals, {
      mealRoles: ["LUNCH"], maxCandidates: 2, bans: [], dietTags: new Set(),
    });
    expect(candidates).toHaveLength(2);
    expect(candidates[0]!.id).toBe("salmon"); // highest protein
  });

  it("keeps pantry foods and assigns meal roles", () => {
    const withPantry = [...foods, row("pantrykale", ["vegetable", "vegan"], 3, true)];
    const { candidates } = selectCandidates(withPantry, goals, {
      mealRoles: ["BREAKFAST", "LUNCH"], maxCandidates: 2, bans: [], dietTags: new Set(),
    });
    expect(candidates.some((c) => c.id === "pantrykale" && c.is_pantry)).toBe(true);
    expect(candidates[0]!.meal_roles).toEqual(["BREAKFAST", "LUNCH"]);
  });

  it("caps oils to a small max to prevent absurd portions", () => {
    const oil = row("oliveoil", ["fat"], null);
    oil.name = "Oil, olive";
    const { candidates } = selectCandidates([oil], [{ key: "protein", target: 1 }], {
      mealRoles: ["LUNCH"], maxCandidates: 10, bans: [], dietTags: new Set(),
    });
    expect(candidates[0]!.max_grams).toBe(30);
  });
});
