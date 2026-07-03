"use client";

import { useCallback, useEffect, useState } from "react";

interface Safety {
  flagged: boolean;
  categories: string[];
  rationale: string[];
  score: number;
}
interface QueueItem {
  id: string;
  title: string;
  body: string;
  safetyJson: Safety | null;
  createdAt: string;
}

/** Moderation queue (F13). Moderators approve/reject/takedown/flag; the safety pre-check is
 *  shown as guidance. No author PII is exposed here. */
export function ModerationQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "forbidden">("loading");

  const load = useCallback(async () => {
    const res = await fetch("/api/moderation/queue");
    if (res.status === 403 || res.status === 401) return setStatus("forbidden");
    const b = await res.json();
    setItems(b.queue ?? []);
    setStatus("ok");
  }, []);

  useEffect(() => {
    load().catch(() => setStatus("forbidden"));
  }, [load]);

  async function decide(id: string, decision: string) {
    const note = decision === "REJECT" || decision === "TAKEDOWN" ? window.prompt("Note (optional)") ?? undefined : undefined;
    await fetch(`/api/moderation/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    load();
  }

  if (status === "loading") return <p className="text-sm text-neutral-500">Loading…</p>;
  if (status === "forbidden")
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">Moderator access required.</p>;
  if (items.length === 0) return <p className="text-sm text-neutral-500">Queue is empty. 🎉</p>;

  return (
    <ul className="flex flex-col gap-3">
      {items.map((it) => (
        <li key={it.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="font-semibold">{it.title}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">{it.body}</p>
          {it.safetyJson && (
            <div
              className={`mt-2 rounded-lg p-2 text-xs ${it.safetyJson.flagged ? "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"}`}
            >
              Auto safety check: {it.safetyJson.flagged ? `flagged (${it.safetyJson.categories.join(", ")})` : "clean"}
              {it.safetyJson.rationale.length > 0 && (
                <ul className="mt-1 list-disc pl-4">
                  {it.safetyJson.rationale.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => decide(it.id, "APPROVE")} className="min-h-9 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white">
              Approve
            </button>
            <button onClick={() => decide(it.id, "REJECT")} className="min-h-9 rounded-lg border border-neutral-300 px-4 text-sm dark:border-neutral-700">
              Reject
            </button>
            <button onClick={() => decide(it.id, "FLAG")} className="min-h-9 rounded-lg px-3 text-sm text-amber-600">
              Flag
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
