/**
 * Plan-orchestration helpers (Prompt 6) — pure. Used by the web plan API to rank
 * candidates before the solver and to VERIFY solver output against the canonical
 * TypeScript proof (rejecting any inconsistent result).
 */
import type { NutrientKey } from "./index";
import type { NutrientProof } from "./proof";

export interface TotalMismatch {
  nutrientKey: string;
  tsValue: number;
  solverValue: number;
  diff: number;
}

export interface ReconcileResult {
  ok: boolean;
  mismatches: TotalMismatch[];
}

/**
 * Reconcile the solver's reported nutrient totals with the independently computed
 * TS proof (known-only consumed). Both sum known contributions, so they must agree
 * within a small epsilon; a larger gap means the solver output is untrustworthy and
 * MUST be rejected (product rule: reject solver output if proof verification fails).
 */
export function reconcileTotals(
  proofs: NutrientProof[],
  solverTotals: Record<string, number>,
  epsilonPct = 1,
): ReconcileResult {
  const mismatches: TotalMismatch[] = [];
  for (const p of proofs) {
    if (p.consumed === null) continue;
    const solverValue = solverTotals[p.nutrientKey];
    if (solverValue === undefined) continue;
    const diff = Math.abs(p.consumed - solverValue);
    const tol = Math.max((epsilonPct / 100) * Math.abs(p.consumed), 0.01);
    if (diff > tol) {
      mismatches.push({ nutrientKey: p.nutrientKey, tsValue: p.consumed, solverValue, diff });
    }
  }
  return { ok: mismatches.length === 0, mismatches };
}

export interface RankableFood {
  id: string;
  per100g: Partial<Record<NutrientKey, number | null>>;
}

export interface RankGoal {
  key: NutrientKey;
  target: number | null;
}

/**
 * Rank candidate foods by how much they cover the targeted nutrients (deficit
 * coverage), normalized by each nutrient's target so heterogeneous units don't
 * dominate. Returns food ids best-first. The plan API sends only the top-N to the
 * solver (never the whole database).
 */
export function rankCandidatesByDeficit(foods: RankableFood[], goals: RankGoal[]): string[] {
  const scored = foods.map((f) => {
    let score = 0;
    for (const g of goals) {
      if (!g.target || g.target <= 0) continue;
      const v = f.per100g[g.key];
      if (v == null) continue;
      score += v / g.target;
    }
    return { id: f.id, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.id);
}
