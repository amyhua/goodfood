/**
 * Portion conversion (Prompt 4). Grams are the canonical calculation unit; household
 * measures are display conveniences. A FoodPortion means: `amount` of `modifier`
 * weighs `gramWeight` grams (e.g. 1 cup = 21 g). Conversions are exact (no rounding).
 */
export interface Portion {
  description: string;
  gramWeight: number;
  amount?: number | null; // count of the household unit; defaults to 1
}

/** Grams that one household unit of this portion weighs. */
export function gramsPerUnit(portion: Portion): number {
  const amount = portion.amount && portion.amount > 0 ? portion.amount : 1;
  if (portion.gramWeight <= 0) throw new Error("portion gramWeight must be > 0");
  return portion.gramWeight / amount;
}

/** Convert grams -> number of household units of the given portion. */
export function gramsToUnits(grams: number, portion: Portion): number {
  if (grams < 0) throw new Error("grams must be non-negative");
  return grams / gramsPerUnit(portion);
}

/** Convert a count of household units -> grams. */
export function unitsToGrams(units: number, portion: Portion): number {
  if (units < 0) throw new Error("units must be non-negative");
  return units * gramsPerUnit(portion);
}
