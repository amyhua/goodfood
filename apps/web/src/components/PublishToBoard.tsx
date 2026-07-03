"use client";

import { useState } from "react";

const DIETS = ["VEGAN", "VEGETARIAN", "PESCATARIAN", "NONDAIRY", "PALEO", "KETO", "WHOLE_FOODS"];
const label = (d: string) => d.replace("_", " ").toLowerCase();

/** Publish a plan to the community board (F8): explicit opt-in with a description + diet tags. */
export function PublishToBoard({ planId, planName }: { planId: string; planName: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(planName);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(d: string) {
    setTags((prev) => (prev.includes(d) ? prev.filter((t) => t !== d) : [...prev, d]));
  }

  async function submit() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mealPlanId: planId, title, description, dietTags: tags }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b?.error ?? "Could not publish");
      setNote("Published to the board.");
      setOpen(false);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-block">
      <button onClick={() => setOpen((v) => !v)} className="min-h-9 rounded px-2 text-sm text-brand-600 hover:bg-brand-50">
        Publish
      </button>
      {open && (
        <div className="mt-2 w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="mb-2 min-h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe your plan (e.g. high-protein vegan week)…"
            className="mb-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <div className="mb-3 flex flex-wrap gap-1.5">
            {DIETS.map((d) => (
              <button
                key={d}
                onClick={() => toggle(d)}
                className={`min-h-8 rounded-full border px-2.5 text-xs capitalize ${tags.includes(d) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 dark:border-neutral-700"}`}
              >
                {label(d)}
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={busy || !title.trim() || !description.trim()}
            className="min-h-10 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Publishing…" : "Publish to board"}
          </button>
        </div>
      )}
      {note && <p className="mt-1 text-xs text-neutral-500">{note}</p>}
    </span>
  );
}
