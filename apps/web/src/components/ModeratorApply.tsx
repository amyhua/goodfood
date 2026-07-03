"use client";

import { useState } from "react";

/** Community-moderator application form (F13). Owner reviews + promotes. */
export function ModeratorApply() {
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/moderators/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ motivation, experience, availability }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b?.error ?? "Could not submit");
      setNote("Submitted — the owner will review your application.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const area = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900";
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Why do you want to moderate?
        <textarea className={`${area} mt-1`} rows={3} value={motivation} onChange={(e) => setMotivation(e.target.value)} required />
      </label>
      <label className="text-sm font-medium">
        Relevant experience
        <textarea className={`${area} mt-1`} rows={2} value={experience} onChange={(e) => setExperience(e.target.value)} required />
      </label>
      <label className="text-sm font-medium">
        Availability
        <input className="mt-1 min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-base dark:border-neutral-700 dark:bg-neutral-900" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g. a few hours/week" required />
      </label>
      <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Submitting…" : "Apply to moderate"}
      </button>
      {note && <p className="text-sm text-neutral-600 dark:text-neutral-400">{note}</p>}
    </form>
  );
}
