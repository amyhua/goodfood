import "server-only";
import type { CandidateFood, NutrientConstraint } from "@goodfood/api-client";
import { rankCandidatesByDeficit, type NutrientKey } from "@goodfood/domain";

export interface NutrientRow {
  nutrientKey: string;
  amountPer100g: number | null;
  dataQuality: string;
  unit: string;
}

export interface FoodRow {
  id: string;
  name: string;
  foodCategory: string | null;
  tags: string[];
  nutrients: NutrientRow[];
  isPantry?: boolean;
  pantryGrams?: number | null;
  fdcId?: number | null;
  dataset?: string | null;
}

export interface BanRule {
  foodId?: string | null;
  tag?: string | null;
}

/** per-100g map + quality for a food, keyed by nutrient key (null == missing). */
export function per100gMap(rows: NutrientRow[]): Record<string, { amount: number | null; unit: string; quality: string }> {
  const map: Record<string, { amount: number | null; unit: string; quality: string }> = {};
  for (const n of rows) {
    map[n.nutrientKey] = { amount: n.amountPer100g, unit: n.unit, quality: n.dataQuality };
  }
  return map;
}

/** A food is banned if its id is banned or any of its tags is banned (invariant 7). */
export function isBanned(food: FoodRow, bans: BanRule[]): boolean {
  const bannedIds = new Set(bans.map((b) => b.foodId).filter(Boolean));
  const bannedTags = new Set(bans.map((b) => b.tag).filter(Boolean));
  if (bannedIds.has(food.id)) return true;
  return food.tags.some((t) => bannedTags.has(t));
}

/** Presets compile to excluded tags (basic; the full engine is Prompt 8). */
const PRESET_EXCLUDED_TAGS: Record<string, string[]> = {
  VEGAN: ["animal", "dairy", "fish", "poultry", "red-meat", "egg"],
  VEGETARIAN: ["fish", "poultry", "red-meat", "meat"],
  PESCATARIAN: ["poultry", "red-meat", "meat"],
  NONDAIRY: ["dairy"],
  PALEO: ["grain", "legume", "dairy"],
  WHOLE_FOODS: ["heavily-processed"],
};

export function dietExcludedTags(presets: string[]): Set<string> {
  const tags = new Set<string>();
  for (const p of presets) for (const t of PRESET_EXCLUDED_TAGS[p] ?? []) tags.add(t);
  return tags;
}

function maxGramsFor(food: FoodRow): number {
  const label = `${food.name} ${food.foodCategory ?? ""}`.toLowerCase();
  if (/\boil\b|fats and oils/.test(label)) return 30; // prevent absurd oil quantities
  if (food.tags.includes("fat")) return 50;
  return 300;
}

export function foodToCandidate(food: FoodRow, mealRoles: string[]): CandidateFood {
  const map = per100gMap(food.nutrients);
  const per100g: Record<string, number | null> = {};
  for (const [k, v] of Object.entries(map)) per100g[k] = v.amount;
  return {
    id: food.id,
    name: food.name,
    meal_roles: mealRoles,
    per100g,
    tags: food.tags,
    category: food.foodCategory ?? null,
    is_pantry: Boolean(food.isPantry),
    pantry_grams: food.pantryGrams ?? null,
    min_grams: 0,
    max_grams: maxGramsFor(food),
  };
}

/**
 * Resolve the candidate pool sent to the solver: filter bans + diet, rank by
 * nutrient deficit, cap to maxCandidates. The solver never receives the whole DB.
 */
export function selectCandidates(
  foods: FoodRow[],
  goals: { key: string; target: number | null }[],
  opts: { mealRoles: string[]; maxCandidates: number; bans: BanRule[]; dietTags: Set<string> },
): { candidates: CandidateFood[]; excluded: { id: string; reason: string }[] } {
  const excluded: { id: string; reason: string }[] = [];
  const eligible = foods.filter((f) => {
    if (isBanned(f, opts.bans)) {
      excluded.push({ id: f.id, reason: "banned" });
      return false;
    }
    const hitTag = f.tags.find((t) => opts.dietTags.has(t));
    if (hitTag) {
      excluded.push({ id: f.id, reason: `diet-excluded (${hitTag})` });
      return false;
    }
    return true;
  });

  const rankable = eligible.map((f) => {
    const map = per100gMap(f.nutrients);
    const per100g: Partial<Record<NutrientKey, number | null>> = {};
    for (const [k, v] of Object.entries(map)) per100g[k as NutrientKey] = v.amount;
    return { id: f.id, per100g };
  });
  const rankedIds = rankCandidatesByDeficit(
    rankable,
    goals.map((g) => ({ key: g.key as NutrientKey, target: g.target })),
  );
  const byId = new Map(eligible.map((f) => [f.id, f]));
  // Pantry foods always kept; then top-ranked shopping foods up to the cap.
  const pantryFirst = [
    ...eligible.filter((f) => f.isPantry).map((f) => f.id),
    ...rankedIds.filter((id) => !byId.get(id)?.isPantry),
  ];
  const chosen = [...new Set(pantryFirst)].slice(0, opts.maxCandidates);
  return {
    candidates: chosen.map((id) => foodToCandidate(byId.get(id)!, opts.mealRoles)),
    excluded,
  };
}

export type { NutrientConstraint };
