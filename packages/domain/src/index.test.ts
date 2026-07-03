import { describe, expect, it } from "vitest";
import { NUTRIENT_KEYS, scalePer100g } from "./index";

describe("domain", () => {
  it("defines the 21 initial nutrients", () => {
    expect(NUTRIENT_KEYS).toHaveLength(21);
    expect(NUTRIENT_KEYS).toContain("choline");
  });
  it("scales per-100g by grams without rounding", () => {
    expect(scalePer100g(10, 250)).toBe(25);
  });
  it("propagates missing (null) as null, never zero", () => {
    expect(scalePer100g(null, 250)).toBeNull();
  });
  it("rejects negative grams", () => {
    expect(() => scalePer100g(10, -1)).toThrow();
  });
});
