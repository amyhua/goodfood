import { describe, expect, it } from "vitest";
import { rankCandidatesByDeficit, reconcileTotals } from "./index";
import type { NutrientProof } from "./index";

function proof(key: string, consumed: number | null): NutrientProof {
  return {
    nutrientKey: key as NutrientProof["nutrientKey"], mode: "MINIMUM", unit: "g",
    target: null, min: null, max: null, consumed, percentOfTarget: null,
    status: "MET", confidence: "COMPLETE", contributors: [], sources: [],
  };
}

describe("reconcileTotals", () => {
  it("accepts totals within epsilon", () => {
    const r = reconcileTotals([proof("protein", 38)], { protein: 38.001 });
    expect(r.ok).toBe(true);
  });
  it("rejects solver output that disagrees with the TS proof", () => {
    const r = reconcileTotals([proof("protein", 38)], { protein: 50 });
    expect(r.ok).toBe(false);
    expect(r.mismatches[0]!.nutrientKey).toBe("protein");
  });
  it("skips nutrients with unknown (null) consumed", () => {
    expect(reconcileTotals([proof("iodine", null)], { iodine: 0 }).ok).toBe(true);
  });
});

describe("rankCandidatesByDeficit", () => {
  it("ranks nutrient-dense foods first, normalized by target", () => {
    const foods = [
      { id: "water", per100g: { protein: 0 } },
      { id: "tofu", per100g: { protein: 15 } },
      { id: "salmon", per100g: { protein: 22 } },
    ];
    const ranked = rankCandidatesByDeficit(foods, [{ key: "protein", target: 50 }]);
    expect(ranked).toEqual(["salmon", "tofu", "water"]);
  });
  it("ignores missing (null) nutrient values", () => {
    const foods = [{ id: "a", per100g: { protein: null } }, { id: "b", per100g: { protein: 5 } }];
    expect(rankCandidatesByDeficit(foods, [{ key: "protein", target: 10 }])[0]).toBe("b");
  });
});
