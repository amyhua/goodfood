"use client";

import { useState } from "react";

interface FoodHit {
  fdcId: number;
  name: string;
  dataType: string;
  category: string | null;
}

/**
 * USDA food search (F1). Mobile-first: a full-width search field with a >=44px submit
 * control and results as stacked cards that never overflow at 375px. Source is always
 * USDA FDC (invariant 1); no nutrition is fabricated — results link to the FDC record.
 */
export function FoodSearch() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [hits, setHits] = useState<FoodHit[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q.trim())}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `Search failed (${res.status})`);
      setHits(body.foods ?? []);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setState("error");
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="food-q" className="sr-only">
          Search foods
        </label>
        <input
          id="food-q"
          type="search"
          inputMode="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search USDA foods — e.g. salmon, kale, Greek yogurt"
          className="min-h-11 w-full rounded-lg border border-neutral-300 px-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="min-h-11 shrink-0 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {state === "loading" ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          {error}. Live USDA search needs a configured FDC_API_KEY and network access.
        </p>
      )}

      {state === "done" && hits.length === 0 && (
        <p className="mt-3 text-sm text-neutral-500">No foods matched “{q}”.</p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {hits.map((f) => (
          <li
            key={f.fdcId}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{f.name}</p>
              <p className="text-xs text-neutral-500">
                {f.dataType}
                {f.category ? ` · ${f.category}` : ""}
              </p>
            </div>
            <a
              href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${f.fdcId}/nutrients`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs font-medium text-brand-600 underline underline-offset-2"
            >
              FDC {f.fdcId}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
