/**
 * Canonical nutrient catalog + default adult targets (docs/product-spec.md §2, ADR-003).
 * Pure data, consumed by the seed (packages/db) and the app. Food *facts* come from
 * USDA FDC (invariant 1); these *target* defaults come from FDA DV / NIH DRI values
 * keyed to a general adult profile — illustrative defaults, adjustable per user (never
 * fabricated as universal). `fdc` lists the FDC nutrient numbers used at ingestion.
 */
import type { DataQuality, NutrientKey, NutrientMode } from "./index";

export type NutrientCategory = "ENERGY" | "MACRO" | "VITAMIN" | "MINERAL" | "FATTY_ACID" | "OTHER";

export interface NutrientCatalogEntry {
  key: NutrientKey;
  displayName: string;
  unit: string;
  category: NutrientCategory;
  sortOrder: number;
  hasDailyValue: boolean;
  /** Tolerable upper intake (total-intake UL) where one applies; else null. */
  defaultUpperLimit: number | null;
  /** FDC nutrient numbers ingested for this key (summed when multiple). */
  fdc: number[];
}

export const NUTRIENT_CATALOG: NutrientCatalogEntry[] = [
  { key: "energy", displayName: "Calories", unit: "kcal", category: "ENERGY", sortOrder: 0, hasDailyValue: true, defaultUpperLimit: null, fdc: [1008] },
  { key: "protein", displayName: "Protein", unit: "g", category: "MACRO", sortOrder: 1, hasDailyValue: true, defaultUpperLimit: null, fdc: [1003] },
  { key: "carbohydrate", displayName: "Carbohydrate", unit: "g", category: "MACRO", sortOrder: 2, hasDailyValue: true, defaultUpperLimit: null, fdc: [1005] },
  { key: "fat", displayName: "Total fat", unit: "g", category: "MACRO", sortOrder: 3, hasDailyValue: true, defaultUpperLimit: null, fdc: [1004] },
  { key: "fiber", displayName: "Fiber", unit: "g", category: "MACRO", sortOrder: 4, hasDailyValue: true, defaultUpperLimit: null, fdc: [1079] },
  { key: "calcium", displayName: "Calcium", unit: "mg", category: "MINERAL", sortOrder: 5, hasDailyValue: true, defaultUpperLimit: 2500, fdc: [1087] },
  { key: "vitamin_d", displayName: "Vitamin D", unit: "mcg", category: "VITAMIN", sortOrder: 6, hasDailyValue: true, defaultUpperLimit: 100, fdc: [1114] },
  { key: "iron", displayName: "Iron", unit: "mg", category: "MINERAL", sortOrder: 7, hasDailyValue: true, defaultUpperLimit: 45, fdc: [1089] },
  { key: "folate_dfe", displayName: "Folate", unit: "mcg DFE", category: "VITAMIN", sortOrder: 8, hasDailyValue: true, defaultUpperLimit: 1000, fdc: [1190] },
  { key: "choline", displayName: "Choline", unit: "mg", category: "VITAMIN", sortOrder: 9, hasDailyValue: true, defaultUpperLimit: 3500, fdc: [1180] },
  { key: "iodine", displayName: "Iodine", unit: "mcg", category: "MINERAL", sortOrder: 10, hasDailyValue: true, defaultUpperLimit: 1100, fdc: [1100] },
  { key: "potassium", displayName: "Potassium", unit: "mg", category: "MINERAL", sortOrder: 11, hasDailyValue: true, defaultUpperLimit: null, fdc: [1092] },
  { key: "magnesium", displayName: "Magnesium", unit: "mg", category: "MINERAL", sortOrder: 12, hasDailyValue: true, defaultUpperLimit: null, fdc: [1090] },
  { key: "vitamin_c", displayName: "Vitamin C", unit: "mg", category: "VITAMIN", sortOrder: 13, hasDailyValue: true, defaultUpperLimit: 2000, fdc: [1162] },
  { key: "vitamin_e", displayName: "Vitamin E", unit: "mg", category: "VITAMIN", sortOrder: 14, hasDailyValue: true, defaultUpperLimit: 1000, fdc: [1109] },
  { key: "vitamin_k", displayName: "Vitamin K", unit: "mcg", category: "VITAMIN", sortOrder: 15, hasDailyValue: true, defaultUpperLimit: null, fdc: [1185] },
  { key: "vitamin_a_rae", displayName: "Vitamin A", unit: "mcg RAE", category: "VITAMIN", sortOrder: 16, hasDailyValue: true, defaultUpperLimit: 3000, fdc: [1106] },
  { key: "vitamin_b12", displayName: "Vitamin B12", unit: "mcg", category: "VITAMIN", sortOrder: 17, hasDailyValue: true, defaultUpperLimit: null, fdc: [1178] },
  { key: "selenium", displayName: "Selenium", unit: "mcg", category: "MINERAL", sortOrder: 18, hasDailyValue: true, defaultUpperLimit: 400, fdc: [1103] },
  { key: "omega3_ala", displayName: "Omega-3 ALA", unit: "g", category: "FATTY_ACID", sortOrder: 19, hasDailyValue: true, defaultUpperLimit: null, fdc: [1404] },
  { key: "omega3_epa_dha", displayName: "Omega-3 EPA+DHA", unit: "mg", category: "FATTY_ACID", sortOrder: 20, hasDailyValue: true, defaultUpperLimit: null, fdc: [1278, 1272] },
];

export interface DefaultGoal {
  nutrientKey: NutrientKey;
  mode: NutrientMode;
  min?: number;
  target?: number;
  max?: number;
  toleranceLowPct?: number;
  toleranceHighPct?: number;
}

/**
 * "Adult general nutrition" default targets. Aligns with the reference plan's
 * left rail (NIH DRI RDA/AI for a general adult). EPA+DHA is a range (250–500 mg)
 * modeled as TARGET with both min and max (product-spec §2.3).
 */
export const DEFAULT_ADULT_GOALS: DefaultGoal[] = [
  { nutrientKey: "energy", mode: "TARGET", target: 2000, toleranceLowPct: 5, toleranceHighPct: 5 },
  { nutrientKey: "protein", mode: "MINIMUM", min: 46 },
  { nutrientKey: "carbohydrate", mode: "MINIMUM", min: 130 },
  { nutrientKey: "fat", mode: "TARGET", target: 65, toleranceLowPct: 20, toleranceHighPct: 20 },
  { nutrientKey: "fiber", mode: "MINIMUM", min: 25 },
  { nutrientKey: "calcium", mode: "TARGET", target: 1000 },
  { nutrientKey: "vitamin_d", mode: "TARGET", target: 15 },
  { nutrientKey: "iron", mode: "TARGET", target: 18 },
  { nutrientKey: "folate_dfe", mode: "TARGET", target: 400 },
  { nutrientKey: "choline", mode: "TARGET", target: 425 },
  { nutrientKey: "iodine", mode: "TARGET", target: 150 },
  { nutrientKey: "potassium", mode: "TARGET", target: 2600 },
  { nutrientKey: "magnesium", mode: "TARGET", target: 320 },
  { nutrientKey: "vitamin_c", mode: "TARGET", target: 75 },
  { nutrientKey: "vitamin_e", mode: "TARGET", target: 15 },
  { nutrientKey: "vitamin_k", mode: "TARGET", target: 90 },
  { nutrientKey: "vitamin_a_rae", mode: "TARGET", target: 700 },
  { nutrientKey: "vitamin_b12", mode: "TARGET", target: 2.4 },
  { nutrientKey: "selenium", mode: "TARGET", target: 55 },
  { nutrientKey: "omega3_ala", mode: "TARGET", target: 1.1 },
  { nutrientKey: "omega3_epa_dha", mode: "TARGET", min: 250, target: 375, max: 500 },
];

/** Canonical unit per nutrient key — used to reject mismatched units at validation. */
export const CANONICAL_UNIT: Record<NutrientKey, string> = Object.fromEntries(
  NUTRIENT_CATALOG.map((n) => [n.key, n.unit]),
) as Record<NutrientKey, string>;

/** A tiny synthetic (non-USDA) food, clearly labeled, for local/dev + tests. */
export interface SyntheticFood {
  slug: string;
  name: string;
  foodCategory: string;
  tags: string[];
  /** per-100g values; omit a key to leave it MISSING (never zero). */
  per100g: Partial<Record<NutrientKey, number>>;
  quality?: DataQuality;
}

/**
 * Synthetic test catalog — DELIBERATELY FAKE numbers (invariant 2). Never presented
 * as USDA-backed. `iodine`/`choline` intentionally omitted on some foods to exercise
 * the "missing != zero" path.
 */
export const SYNTHETIC_FOODS: SyntheticFood[] = [
  {
    slug: "synthetic-oats",
    name: "Synthetic Oats, cooked",
    foodCategory: "Grains",
    tags: ["grain", "vegan", "vegetarian", "whole-food"],
    per100g: { energy: 71, protein: 2.5, carbohydrate: 12, fat: 1.5, fiber: 1.7, magnesium: 27, iron: 0.9 },
  },
  {
    slug: "synthetic-tofu",
    name: "Synthetic Tofu, firm",
    foodCategory: "Legumes",
    tags: ["legume", "vegan", "vegetarian", "whole-food"],
    per100g: { energy: 144, protein: 15, carbohydrate: 3, fat: 8, calcium: 350, iron: 2.7, magnesium: 58 },
  },
  {
    slug: "synthetic-salmon",
    name: "Synthetic Salmon, cooked",
    foodCategory: "Fish",
    tags: ["fish", "animal", "pescatarian", "whole-food"],
    // omega3 + B12 + D present; iodine/choline intentionally MISSING (not zero).
    per100g: { energy: 206, protein: 22, fat: 12, vitamin_d: 13, vitamin_b12: 3.2, omega3_epa_dha: 2200, selenium: 41 },
  },
  {
    slug: "synthetic-kale",
    name: "Synthetic Kale, raw",
    foodCategory: "Vegetables",
    tags: ["vegetable", "vegan", "vegetarian", "whole-food"],
    per100g: { energy: 35, protein: 2.9, carbohydrate: 4.4, fiber: 4.1, vitamin_c: 93, vitamin_k: 390, vitamin_a_rae: 500, calcium: 254 },
  },
];
