"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShareSheet } from "@/components/ShareSheet";
import { PublishToBoard } from "@/components/PublishToBoard";

interface PlanRow {
  id: string;
  name: string;
  status: string;
  durationDays: number;
  updatedAt: string;
}
interface ListRow {
  id: string;
  name: string;
  mealPlanId: string | null;
  updatedAt: string;
}

/**
 * My saved content (F2): the caller's plans + shopping lists with rename/delete. Anonymous
 * callers act as the shared demo user — a banner nudges them to sign in so content is truly
 * theirs. Everything is fetched from the ownership-guarded APIs.
 */
export function MyPlans() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [authenticated, setAuthenticated] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [p, l] = await Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/shopping-lists").then((r) => r.json()),
    ]);
    setPlans(p.plans ?? []);
    setLists(l.lists ?? []);
    setAuthenticated(Boolean(p.authenticated));
    setLoaded(true);
  }, []);

  useEffect(() => {
    load().catch(() => setLoaded(true));
  }, [load]);

  async function renamePlan(id: string, current: string) {
    const name = window.prompt("New plan name", current);
    if (!name?.trim()) return;
    await fetch(`/api/plans/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    load();
  }
  async function deletePlan(id: string) {
    if (!window.confirm("Delete this plan?")) return;
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    load();
  }
  async function renameList(id: string, current: string) {
    const name = window.prompt("New list name", current);
    if (!name?.trim()) return;
    await fetch(`/api/shopping-lists/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    load();
  }
  async function deleteList(id: string) {
    if (!window.confirm("Delete this list?")) return;
    await fetch(`/api/shopping-lists/${id}`, { method: "DELETE" });
    load();
  }

  if (!loaded) return <p className="text-sm text-neutral-500">Loading…</p>;

  return (
    <div className="flex flex-col gap-8">
      {!authenticated && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          You’re browsing as a guest.{" "}
          <Link href="/signup" className="font-semibold underline underline-offset-2">
            Create an account
          </Link>{" "}
          to keep your plans private and portable.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Meal plans</h2>
        {plans.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No saved plans yet. <Link href="/planner" className="text-brand-600 underline">Generate one</Link>.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {plans.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
              >
                <Link href={`/planner?planId=${p.id}`} className="min-w-0 flex-1 truncate font-medium">
                  {p.name}
                </Link>
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                  {p.status.toLowerCase()} · {p.durationDays}d
                </span>
                <ShareSheet kind="PLAN" id={p.id} title={p.name} summary={`${p.durationDays}-day meal plan`} />
                <PublishToBoard planId={p.id} planName={p.name} />
                <button onClick={() => renamePlan(p.id, p.name)} className="min-h-9 rounded px-2 text-sm text-brand-600 hover:bg-brand-50">
                  Rename
                </button>
                <button onClick={() => deletePlan(p.id)} className="min-h-9 rounded px-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Shopping lists</h2>
        {lists.length === 0 ? (
          <p className="text-sm text-neutral-500">No saved shopping lists yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lists.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{l.name}</span>
                <ShareSheet kind="LIST" id={l.id} title={l.name} summary="Shopping list" />
                <button onClick={() => renameList(l.id, l.name)} className="min-h-9 rounded px-2 text-sm text-brand-600 hover:bg-brand-50">
                  Rename
                </button>
                <button onClick={() => deleteList(l.id)} className="min-h-9 rounded px-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
