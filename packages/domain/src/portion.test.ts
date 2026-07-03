import { describe, expect, it } from "vitest";
import { gramsToUnits, gramsPerUnit, unitsToGrams } from "./index";

const cup = { description: "1 cup", gramWeight: 240, amount: 1 };
const halfCupPortion = { description: "1/2 cup", gramWeight: 120, amount: 0.5 }; // 240 g/cup

describe("portion conversion", () => {
  it("computes grams per unit from amount + gramWeight", () => {
    expect(gramsPerUnit(cup)).toBe(240);
    expect(gramsPerUnit(halfCupPortion)).toBe(240);
  });
  it("converts grams <-> units exactly (round-trips)", () => {
    expect(gramsToUnits(360, cup)).toBe(1.5);
    expect(unitsToGrams(2, cup)).toBe(480);
    expect(unitsToGrams(gramsToUnits(137.5, cup), cup)).toBeCloseTo(137.5, 9);
  });
  it("rejects invalid inputs", () => {
    expect(() => gramsToUnits(-1, cup)).toThrow();
    expect(() => gramsPerUnit({ description: "x", gramWeight: 0 })).toThrow();
  });
});
