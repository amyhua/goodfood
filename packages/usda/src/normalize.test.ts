import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/food-detail.json";
import { normalizeFood } from "./normalize";
import type { FdcFoodDetail } from "./types";

const norm = normalizeFood(fixture as FdcFoodDetail, "2026-07-03T00:00:00.000Z");
const by = (key: string) => norm.nutrients.find((n) => n.nutrientKey === key)!;

describe("normalizeFood", () => {
  it("maps source dataset to source enum", () => {
    expect(norm.source).toBe("USDA_FOUNDATION");
    expect(norm.fdcId).toBe(999001);
  });

  it("captures protein, vitamin E, and choline with source ids", () => {
    expect(by("protein").amountPer100g).toBeCloseTo(22.1, 5);
    expect(by("protein").dataQuality).toBe("KNOWN");
    expect(by("vitamin_e").amountPer100g).toBeCloseTo(3.5, 5);
    expect(by("choline").amountPer100g).toBeCloseTo(95, 5);
    expect(by("choline").nutrientSourceId).toBe("1180");
  });

  it("ingests aliases from converted FDC ids (folate DFE, vitamin A RAE, D)", () => {
    expect(by("folate_dfe").amountPer100g).toBeCloseTo(26, 5);
    expect(by("folate_dfe").unit).toBe("mcg DFE");
    expect(by("vitamin_a_rae").amountPer100g).toBeCloseTo(12, 5);
    expect(by("vitamin_d").amountPer100g).toBeCloseTo(13.1, 5);
  });

  it("sums EPA+DHA and converts grams to canonical mg", () => {
    // (0.69 + 1.46) g = 2.15 g = 2150 mg
    expect(by("omega3_epa_dha").amountPer100g).toBeCloseTo(2150, 3);
    expect(by("omega3_epa_dha").unit).toBe("mg");
  });

  it("picks kcal energy (1008), never the kJ entry (1062)", () => {
    expect(by("energy").amountPer100g).toBeCloseTo(206, 5);
    expect(by("energy").unit).toBe("kcal");
  });

  it("leaves absent iodine and magnesium MISSING, never zero (invariant 4)", () => {
    expect(by("iodine").amountPer100g).toBeNull();
    expect(by("iodine").dataQuality).toBe("MISSING");
    expect(by("magnesium").amountPer100g).toBeNull();
    expect(by("magnesium").dataQuality).toBe("MISSING");
  });

  it("normalizes portions with gram weights", () => {
    expect(norm.portions).toHaveLength(2);
    expect(norm.portions[0]!.gramWeight).toBe(154);
  });
});
