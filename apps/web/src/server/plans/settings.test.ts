import { describe, expect, it } from "vitest";
import { generateSettingsSchema } from "./settings";

describe("generate settings validation", () => {
  it("applies defaults for an empty object", () => {
    const s = generateSettingsSchema.parse({});
    expect(s.userId).toBe("seed-demo-user");
    expect(s.mealRoles).toEqual(["BREAKFAST", "LUNCH", "DINNER"]);
    expect(s.durationDays).toBe(1);
  });
  it("rejects out-of-range durationDays with structured errors", () => {
    const r = generateSettingsSchema.safeParse({ durationDays: 0 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.durationDays).toBeDefined();
  });
  it("rejects an unknown nutrient key in a goal override", () => {
    expect(generateSettingsSchema.safeParse({ goalOverrides: [{ key: "unobtainium", mode: "MINIMUM" }] }).success).toBe(false);
  });
  it("accepts a valid goal override", () => {
    const s = generateSettingsSchema.parse({ goalOverrides: [{ key: "iron", mode: "MINIMUM", min: 18 }] });
    expect(s.goalOverrides[0]!.key).toBe("iron");
  });
});
