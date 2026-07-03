/**
 * Validation for recommendation goals, portions, and pantry (Prompt 2).
 * Enforces the invariants at the app boundary; the DB carries matching CHECKs.
 */
import { z } from "zod";
import { CANONICAL_UNIT } from "./catalog";
import { NUTRIENT_KEYS, type NutrientKey, type NutrientMode } from "./index";

export interface GoalInput {
  nutrientKey: string;
  mode: NutrientMode;
  min?: number | null;
  target?: number | null;
  max?: number | null;
  unit?: string;
}

/** Returns a list of human-readable violations; empty array = valid. */
export function validateGoal(goal: GoalInput): string[] {
  const errors: string[] = [];
  const { mode, min, target, max } = goal;

  if (!NUTRIENT_KEYS.includes(goal.nutrientKey as NutrientKey)) {
    errors.push(`unknown nutrient key "${goal.nutrientKey}"`);
  } else if (goal.unit !== undefined) {
    const expected = CANONICAL_UNIT[goal.nutrientKey as NutrientKey];
    if (goal.unit !== expected) {
      errors.push(`unit "${goal.unit}" invalid for ${goal.nutrientKey}; expected "${expected}"`);
    }
  }

  const has = (v: number | null | undefined): v is number => v !== null && v !== undefined;

  // Ordering: only compare pairs that are both present. min <= target <= max.
  if (has(min) && has(max) && min > max) errors.push("min must be <= max");
  if (has(min) && has(target) && min > target) errors.push("min must be <= target");
  if (has(target) && has(max) && target > max) errors.push("target must be <= max");
  for (const [name, v] of [["min", min], ["target", target], ["max", max]] as const) {
    if (has(v) && v < 0) errors.push(`${name} must be non-negative`);
  }

  // Mode consistency. DISABLED must carry NO bounds — it is not a maximum of 0.
  switch (mode) {
    case "DISABLED":
      if (has(min) || has(target) || has(max)) {
        errors.push("DISABLED nutrient must have no bounds (it is not a maximum of 0)");
      }
      break;
    case "MINIMUM":
      if (!has(min)) errors.push("MINIMUM mode requires a min");
      break;
    case "TARGET":
      if (!has(target) && !(has(min) && has(max))) {
        errors.push("TARGET mode requires a target (or a min+max range)");
      }
      break;
    case "MAXIMUM":
      if (!has(max)) errors.push("MAXIMUM mode requires a max");
      break;
  }
  return errors;
}

export function isGoalValid(goal: GoalInput): boolean {
  return validateGoal(goal).length === 0;
}

/** No two goals may target the same nutrient key. */
export function findDuplicateNutrientKeys(keys: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const k of keys) {
    if (seen.has(k)) dupes.add(k);
    seen.add(k);
  }
  return [...dupes];
}

/** Grams for a meal ingredient / portion must be strictly positive. */
export const gramsSchema = z.number().finite().positive("grams must be > 0");

/** Pantry quantity is non-negative, or null (= unknown, "check pantry"). */
export const pantryQuantitySchema = z.number().finite().nonnegative().nullable();

export function assertPositiveGrams(grams: number): number {
  return gramsSchema.parse(grams);
}
