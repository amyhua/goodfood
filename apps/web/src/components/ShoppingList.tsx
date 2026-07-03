"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShoppingItem } from "@/lib/plan-view";
import { readPantry, type PantryItem } from "@/components/Pantry";

/**
 * Shopping list (F1): plan ingredients grouped by category, with on-device pantry
 * subtraction and a print action. Grams unknown stay "—" (never 0). Print styling
 * lives in globals.css (@media print) so the printed sheet is clean on Letter/Legal.
 */
function subtract(items: ShoppingItem[], pantry: PantryItem[]): ShoppingItem[] {
  const have = new Map(pantry.map((p) => [p.name.toLowerCase(), p.grams]));
  return items
    .map((item) => {
      const owned = have.get(item.foodName.toLowerCase());
      if (owned == null || item.grams == null) return item;
      const remaining = item.grams - owned;
      return { ...item, grams: remaining > 0 ? remaining : 0 };
    })
    .filter((item) => item.grams == null || item.grams > 0);
}

export function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [applyPantry, setApplyPantry] = useState(true);

  useEffect(() => {
    setPantry(readPantry());
  }, []);

  const effective = useMemo(
    () => (applyPantry ? subtract(items, pantry) : items),
    [items, pantry, applyPantry],
  );

  const groups = useMemo(() => {
    const byCat = new Map<string, ShoppingItem[]>();
    for (const item of effective) {
      const list = byCat.get(item.category) ?? [];
      list.push(item);
      byCat.set(item.category, list);
    }
    return [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [effective]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700">
          <input
            type="checkbox"
            checked={applyPantry}
            onChange={(e) => setApplyPantry(e.target.checked)}
            className="size-4"
          />
          Subtract pantry ({pantry.length})
        </label>
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-11 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Print
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing to buy — your pantry covers this plan.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([category, list]) => (
            <section key={category}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {category}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {list.map((item) => (
                  <li
                    key={item.foodName}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-2 dark:border-neutral-800"
                  >
                    <span className="min-w-0 truncate font-medium">{item.foodName}</span>
                    <span className="shrink-0 tabular-nums text-neutral-600 dark:text-neutral-400">
                      {item.grams == null ? "—" : `${Math.round(item.grams)} g`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
