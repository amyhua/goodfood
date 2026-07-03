/**
 * Display formatting (Prompt 4). Operates on already-computed RAW values — it never
 * feeds back into calculation. Rounding policy per docs/product-spec.md §2.3.
 */
function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Format a nutrient amount for display by unit. Missing (null) => "—" (never 0). */
export function formatAmount(value: number | null, unit: string): string {
  if (value === null) return "—";
  const u = unit.toLowerCase();
  if (u === "kcal") return `${Math.round(value)} kcal`;
  if (u === "g") return `${roundTo(value, 1)} g`;
  if (u === "mg") return `${value < 10 ? roundTo(value, 1) : Math.round(value)} mg`;
  if (u.startsWith("mcg")) return `${Math.round(value)} ${unit}`;
  return `${roundTo(value, 2)} ${unit}`.trim();
}

/** Percent-of-target for display. null => "—" (product rule 4: never a fabricated 0%). */
export function formatPercent(pct: number | null): string {
  return pct === null ? "—" : `${Math.round(pct)}%`;
}
