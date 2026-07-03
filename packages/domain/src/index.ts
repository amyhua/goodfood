/**
 * @goodfood/domain — pure, dependency-free domain types and calculations.
 * Prompt 1 ships the canonical nutrient keys + the per-100g scaling primitive;
 * Prompt 4 expands this into the full proof engine.
 */

/** The 21 initial nutrients (see docs/product-spec.md §2.1). */
export const NUTRIENT_KEYS = [
  "energy",
  "protein",
  "carbohydrate",
  "fat",
  "fiber",
  "calcium",
  "vitamin_d",
  "iron",
  "folate_dfe",
  "choline",
  "iodine",
  "potassium",
  "magnesium",
  "vitamin_c",
  "vitamin_e",
  "vitamin_k",
  "vitamin_a_rae",
  "vitamin_b12",
  "selenium",
  "omega3_ala",
  "omega3_epa_dha",
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

/** Per-nutrient optimization mode (product-spec §2.2). DISABLED !== MAXIMUM of 0.
 *  Casing matches the Prisma `NutrientMode` enum for clean DB interop. */
export type NutrientMode = "DISABLED" | "MINIMUM" | "TARGET" | "MAXIMUM";

/** Data-quality state for a stored nutrient value (product-spec §4). MISSING !== zero.
 *  Casing matches the Prisma `DataQuality` enum. */
export type DataQuality = "KNOWN" | "PARTIAL" | "MISSING" | "ESTIMATED" | "USER_ENTERED";

/**
 * Scale a per-100g nutrient amount to `grams`. Returns `null` when the source
 * value is missing — missing propagates as unknown, never zero (invariant 4).
 * No rounding here; callers round only at display time.
 */
export function scalePer100g(per100g: number | null, grams: number): number | null {
  if (per100g === null) return null;
  if (grams < 0) throw new Error("grams must be non-negative");
  return (per100g * grams) / 100;
}

export * from "./catalog";
export * from "./validation";

export * from "./proof";
export * from "./portion";
export * from "./format";
