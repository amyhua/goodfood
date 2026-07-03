import { describe, expect, it } from "vitest";
import { runSafetyCheck } from "./safety";

describe("safety heuristic", () => {
  it("passes ordinary wholesome content", () => {
    const r = runSafetyCheck("A balanced high-protein vegan day with lentils and tofu.");
    expect(r.flagged).toBe(false);
    expect(r.categories).toHaveLength(0);
    expect(r.score).toBe(0);
  });

  it("flags medical over-claims with rationale", () => {
    const r = runSafetyCheck("This plan cures diabetes and is a miracle detox!");
    expect(r.flagged).toBe(true);
    expect(r.categories).toContain("medical-overclaim");
    expect(r.rationale.join(" ")).toMatch(/matched/);
    expect(r.score).toBeGreaterThan(0);
  });

  it("flags unsafe disordered-eating cues", () => {
    const r = runSafetyCheck("Just starve yourself, only 300 calories a day.");
    expect(r.categories).toContain("unsafe");
  });

  it("flags spam", () => {
    const r = runSafetyCheck("Buy now! Use promo code SAVE. Click here.");
    expect(r.categories).toContain("spam");
  });

  it("accumulates categories and caps the score at 1", () => {
    const r = runSafetyCheck("Miracle cure! Buy now! Starve for 7 days. Click here promo code X.");
    expect(r.categories.length).toBeGreaterThanOrEqual(2);
    expect(r.score).toBeLessThanOrEqual(1);
  });
});
