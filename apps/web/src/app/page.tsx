import Link from "next/link";

const FEATURES = [
  { href: "/planner", title: "Planner", body: "A day of meals with a source-linked nutrient proof." },
  { href: "/foods", title: "Foods", body: "Search USDA FoodData Central — never fabricated nutrition." },
  { href: "/pantry", title: "Pantry", body: "Track what you have; the shopping list subtracts it." },
  { href: "/shopping", title: "Shopping list", body: "Grouped by category, print-ready." },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <header className="mb-10">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          goodfood
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Nutrition meal planner
        </h1>
        <p className="mt-3 max-w-prose text-neutral-600 dark:text-neutral-400">
          Source-traceable meal plans with a nutrient proof table. Every number links back to USDA
          FoodData Central — missing data is shown as missing, never as zero.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/planner"
            className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Open the planner
          </Link>
          <Link
            href="/foods"
            className="inline-flex min-h-11 items-center rounded-lg border border-neutral-300 px-6 text-sm font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Browse foods
          </Link>
        </div>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <li key={f.href}>
            <Link
              href={f.href}
              className="block h-full rounded-xl border border-neutral-200 p-4 transition-colors hover:border-brand-400 dark:border-neutral-800"
            >
              <p className="font-semibold">{f.title}</p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{f.body}</p>
            </Link>
          </li>
        ))}
      </ul>

      <footer className="mt-10 text-sm text-neutral-500">
        <Link href="/health" className="underline underline-offset-4 hover:text-brand-600">
          Service health
        </Link>
      </footer>
    </main>
  );
}
