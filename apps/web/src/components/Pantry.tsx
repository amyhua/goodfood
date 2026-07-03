"use client";

import { useEffect, useState } from "react";

/**
 * Pantry manager (F1). Client-side (localStorage) for now — DB-backed pantry with
 * per-user ownership lands in a later stream (F2). Mobile-first: full-width add form,
 * stepper-friendly quantity, >=44px controls, stacked cards. The pantry mode mirrors
 * the product spec (pantry-only / prefer-pantry / pantry-plus-shopping).
 */
export interface PantryItem {
  name: string;
  grams: number;
}

const STORAGE_KEY = "goodfood.pantry.v1";
const MODE_KEY = "goodfood.pantryMode.v1";

const MODES = [
  { value: "PANTRY_ONLY", label: "Pantry only" },
  { value: "PREFER_PANTRY", label: "Prefer pantry" },
  { value: "PANTRY_PLUS_SHOPPING", label: "Pantry + shopping" },
] as const;

export function readPantry(): PantryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PantryItem[]) : [];
  } catch {
    return [];
  }
}

export function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [mode, setMode] = useState<string>("PANTRY_PLUS_SHOPPING");
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(readPantry());
    try {
      const m = window.localStorage.getItem(MODE_KEY);
      if (m) setMode(m);
    } catch {
      /* ignore */
    }
  }, []);

  function persist(next: PantryItem[]) {
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const g = Number(grams);
    if (!trimmed) return setError("Enter a food name.");
    if (!Number.isFinite(g) || g <= 0) return setError("Enter a quantity in grams (> 0).");
    setError(null);
    const idx = items.findIndex((i) => i.name.toLowerCase() === trimmed.toLowerCase());
    const next =
      idx >= 0
        ? items.map((i, n) => (n === idx ? { ...i, grams: i.grams + g } : i))
        : [...items, { name: trimmed, grams: g }];
    persist(next);
    setName("");
    setGrams("");
  }

  function remove(target: string) {
    persist(items.filter((i) => i.name !== target));
  }

  function updateMode(m: string) {
    setMode(m);
    try {
      window.localStorage.setItem(MODE_KEY, m);
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Pantry mode
        </legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          {MODES.map((m) => (
            <label
              key={m.value}
              className={`flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${
                mode === m.value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              <input
                type="radio"
                name="pantry-mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => updateMode(m.value)}
                className="size-4"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Food name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Food (e.g. Rolled oats)"
          className="min-h-11 w-full rounded-lg border border-neutral-300 px-4 text-base outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          aria-label="Quantity in grams"
          type="number"
          inputMode="numeric"
          min={1}
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          placeholder="grams"
          className="min-h-11 rounded-lg border border-neutral-300 px-4 text-base outline-none focus:border-brand-500 sm:w-32 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">
          Your pantry is empty. Add what you already have — the shopping list subtracts it.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {items.map((i) => (
            <li
              key={i.name}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div>
                <p className="font-medium">{i.name}</p>
                <p className="text-xs text-neutral-500 tabular-nums">{Math.round(i.grams)} g</p>
              </div>
              <button
                type="button"
                onClick={() => remove(i.name)}
                className="min-h-9 rounded-lg px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
