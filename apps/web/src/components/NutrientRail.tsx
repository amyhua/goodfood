import { formatAmount, formatPercent } from "@goodfood/domain";
import type { ProofRow } from "../lib/plan-view";

/**
 * Headline-nutrient rail (F1). A compact chip summary of the nutrients people scan
 * first. Collapsible on mobile via <details> (open by default) so it never crowds the
 * meals on a phone; always visible on desktop.
 */
const HEADLINE = [
  "energy",
  "protein",
  "fiber",
  "calcium",
  "iron",
  "vitamin_d",
  "vitamin_b12",
  "potassium",
];

const DOT: Record<string, string> = {
  MET: "bg-emerald-500",
  UNDER: "bg-amber-500",
  OVER: "bg-rose-500",
  UNKNOWN: "bg-neutral-400",
};

function Chips({ rows }: { rows: ProofRow[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {rows.map((r) => (
        <li
          key={r.nutrientKey}
          className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800"
        >
          <div className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2 rounded-full ${DOT[r.status] ?? DOT.UNKNOWN}`} />
            <span className="truncate text-xs text-neutral-500">{r.displayName}</span>
          </div>
          <p className="mt-0.5 font-semibold tabular-nums">{formatAmount(r.consumed, r.unit)}</p>
          <p className="text-xs text-neutral-500 tabular-nums">
            {r.mode === "TARGET" ? `${formatPercent(r.percentOfTarget)} of target` : r.status}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function NutrientRail({ rows }: { rows: ProofRow[] }) {
  const headline = HEADLINE.map((k) => rows.find((r) => r.nutrientKey === k)).filter(
    (r): r is ProofRow => Boolean(r),
  );
  return (
    <details open className="rounded-xl border border-neutral-200 p-3 md:p-4 dark:border-neutral-800">
      <summary className="mb-3 flex min-h-10 cursor-pointer list-none items-center justify-between font-semibold marker:content-none">
        <span>At a glance</span>
        <span className="text-sm font-normal text-neutral-400 md:hidden">tap to toggle</span>
      </summary>
      <Chips rows={headline} />
    </details>
  );
}
