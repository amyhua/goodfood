import { formatAmount, formatPercent } from "@goodfood/domain";
import type { ProofRow } from "../lib/plan-view";

/**
 * Source-linked nutrient proof table (invariant 9), responsive (F1).
 * Desktop (>= md): a real <table>. Mobile: the same rows as stacked cards so nothing
 * overflows at 375px. Missing data renders "—" (never 0); PARTIAL/MISSING confidence
 * is always shown so a target is never claimed "met" on missing data (invariant 4).
 */
const STATUS_STYLE: Record<string, string> = {
  MET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  UNDER: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  OVER: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  UNKNOWN: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? STATUS_STYLE.UNKNOWN}`}
    >
      {status}
    </span>
  );
}

function targetLabel(row: ProofRow): string {
  if (row.mode === "DISABLED") return "off";
  if (row.mode === "MINIMUM") return `≥ ${formatAmount(row.min, row.unit)}`;
  if (row.mode === "MAXIMUM") return `≤ ${formatAmount(row.max, row.unit)}`;
  return formatAmount(row.target, row.unit);
}

export function ProofTable({ rows }: { rows: ProofRow[] }) {
  const active = rows.filter((r) => r.mode !== "DISABLED");
  return (
    <section aria-labelledby="proof-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="proof-heading" className="text-lg font-semibold">
          Nutrient proof
        </h2>
        <p className="text-xs text-neutral-500">
          Per-day totals vs. targets. “—” means the source has no value (never treated as 0).
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <th className="py-2 pr-4 font-medium">Nutrient</th>
              <th className="py-2 pr-4 font-medium">Consumed</th>
              <th className="py-2 pr-4 font-medium">Target</th>
              <th className="py-2 pr-4 font-medium">% </th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {active.map((row) => (
              <tr key={row.nutrientKey} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 pr-4 font-medium">{row.displayName}</td>
                <td className="py-2 pr-4 tabular-nums">{formatAmount(row.consumed, row.unit)}</td>
                <td className="py-2 pr-4 tabular-nums text-neutral-600 dark:text-neutral-400">
                  {targetLabel(row)}
                </td>
                <td className="py-2 pr-4 tabular-nums">{formatPercent(row.percentOfTarget)}</td>
                <td className="py-2 pr-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-2 text-xs text-neutral-500">
                  {row.confidence === "COMPLETE" ? "complete" : row.confidence.toLowerCase()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {active.map((row) => (
          <li
            key={row.nutrientKey}
            className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{row.displayName}</span>
              <StatusBadge status={row.status} />
            </div>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-neutral-500">Consumed</dt>
                <dd className="tabular-nums">{formatAmount(row.consumed, row.unit)}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Target</dt>
                <dd className="tabular-nums">{targetLabel(row)}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">%</dt>
                <dd className="tabular-nums">{formatPercent(row.percentOfTarget)}</dd>
              </div>
            </dl>
            {row.confidence !== "COMPLETE" && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {row.confidence === "MISSING"
                  ? "No source data for this nutrient"
                  : "Partial data — some contributors missing this nutrient"}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
