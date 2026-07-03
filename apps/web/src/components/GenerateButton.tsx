"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Progressive-enhancement generate action (F1). POSTs to /api/plans/generate and, on
 * success, navigates to the persisted plan. When the solver/DB are unavailable it
 * surfaces a friendly message rather than failing silently — the page keeps showing
 * the honest sample. Touch target is a full-height (>=44px) button.
 */
export function GenerateButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function generate() {
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "My day plan", durationDays: 1, seed: 0 }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Generate failed (${res.status})`);
      }
      const body = (await res.json()) as { id?: string; planId?: string };
      const id = body.id ?? body.planId;
      if (!id) throw new Error("No plan id returned");
      router.push(`/planner?planId=${id}`);
    } catch (err) {
      setState("error");
      setMessage(
        err instanceof Error
          ? `${err.message}. The solver may be offline — showing the sample instead.`
          : "Generate failed.",
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={generate}
        disabled={state === "loading"}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {state === "loading" ? "Generating…" : "Generate a plan"}
      </button>
      {message && <p className="text-sm text-amber-600 dark:text-amber-400">{message}</p>}
    </div>
  );
}
