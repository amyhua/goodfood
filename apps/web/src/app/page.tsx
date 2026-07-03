import Link from "next/link";

const phases = [
  { label: "Product contract", state: "done" },
  { label: "Monorepo & quality gates", state: "active" },
  { label: "Nutrition & plan schema", state: "todo" },
  { label: "USDA ingestion", state: "todo" },
  { label: "Proof engine", state: "todo" },
  { label: "Solver service", state: "todo" },
  { label: "Plan API", state: "todo" },
  { label: "Planner UI (MVP)", state: "todo" },
] as const;

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          goodfood
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Nutrition meal planner</h1>
        <p className="mt-2 max-w-prose text-neutral-600 dark:text-neutral-400">
          Source-traceable meal plans with a nutrient proof table. This is the scaffolding shell —
          the planner ships in a later phase.
        </p>
      </header>

      <section aria-labelledby="phases-heading" className="mb-10">
        <h2 id="phases-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Build progress
        </h2>
        <ol className="space-y-1">
          {phases.map((p) => (
            <li
              key={p.label}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-2 dark:border-neutral-800"
            >
              <span
                aria-hidden
                className={
                  p.state === "done"
                    ? "size-2.5 rounded-full bg-brand-600"
                    : p.state === "active"
                      ? "size-2.5 rounded-full bg-amber-500"
                      : "size-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"
                }
              />
              <span className="text-sm">{p.label}</span>
              <span className="ml-auto text-xs uppercase tracking-wide text-neutral-400">
                {p.state}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="text-sm text-neutral-500">
        <Link href="/health" className="underline underline-offset-4 hover:text-brand-600">
          Service health
        </Link>
      </footer>
    </main>
  );
}
