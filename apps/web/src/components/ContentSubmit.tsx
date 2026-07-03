"use client";

import { useState } from "react";

/** Submit a content-team post for moderation (F13): create a draft, then submit → safety check. */
export function ContentSubmit() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const draft = await fetch("/api/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const d = await draft.json();
      if (!draft.ok) throw new Error(d?.error ?? "Could not create");
      const res = await fetch(`/api/content/${d.id}/submit`, { method: "POST" });
      const s = await res.json();
      if (!res.ok) throw new Error(s?.error ?? "Could not submit");
      setNote(
        s.safety?.flagged
          ? `Submitted — auto-flagged (${s.safety.categories.join(", ")}); a moderator will review.`
          : "Submitted for review — a moderator will approve it before it goes live.",
      );
      setTitle("");
      setBody("");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        className="min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-base dark:border-neutral-700 dark:bg-neutral-900"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
        rows={6}
        placeholder="Highlight a creator, share a tip… (goes through moderation before publishing)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />
      <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Submitting…" : "Submit for review"}
      </button>
      {note && <p className="text-sm text-neutral-600 dark:text-neutral-400">{note}</p>}
    </form>
  );
}
