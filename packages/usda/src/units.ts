/** Unit normalization FDC → canonical (Prompt 3). Weight bases in grams. */

const WEIGHT_BASE: Record<string, number> = { g: 1, mg: 1e-3, mcg: 1e-6 };

/** Reduce an FDC/canonical unit label to a base token: g | mg | mcg | kcal | iu. */
export function baseUnit(unit: string): string {
  const u = unit.trim().toLowerCase();
  if (u === "µg" || u === "ug" || u === "mcg" || u.startsWith("mcg ")) return "mcg";
  if (u === "mg") return "mg";
  if (u === "g") return "g";
  if (u === "kcal") return "kcal";
  if (u === "iu") return "iu";
  return u;
}

/**
 * Convert `amount` from `fromUnit` to `toUnit`. Returns null when incompatible
 * (e.g. IU without a nutrient-specific factor) so callers keep it MISSING rather
 * than fabricate a number (invariant 4). Same-base conversions are exact.
 */
export function convert(amount: number, fromUnit: string, toUnit: string): number | null {
  const from = baseUnit(fromUnit);
  const to = baseUnit(toUnit);
  if (from === to) return amount;
  if (from === "kcal" || to === "kcal" || from === "iu" || to === "iu") return null;
  const f = WEIGHT_BASE[from];
  const t = WEIGHT_BASE[to];
  if (f === undefined || t === undefined) return null;
  return (amount * f) / t;
}
