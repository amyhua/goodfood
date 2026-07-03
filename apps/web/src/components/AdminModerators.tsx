"use client";

import { useCallback, useEffect, useState } from "react";

interface Pending {
  userId: string;
  motivation: string;
  experience: string;
  availability: string;
  user: { email: string; name: string | null };
}

/** Owner review of community-moderator applications (F13). ADMIN_EMAILS-gated by the API. */
export function AdminModerators() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "forbidden">("loading");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/moderators");
    if (res.status === 403) return setStatus("forbidden");
    const b = await res.json();
    setPending(b.pending ?? []);
    setStatus("ok");
  }, []);

  useEffect(() => {
    load().catch(() => setStatus("forbidden"));
  }, [load]);

  async function decide(userId: string, decision: "APPROVED" | "REJECTED") {
    await fetch("/api/admin/moderators", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, decision }),
    });
    load();
  }

  if (status === "loading") return <p className="text-sm text-neutral-500">Loading…</p>;
  if (status === "forbidden")
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Owner access required (<code>ADMIN_EMAILS</code>).
      </p>
    );
  if (pending.length === 0) return <p className="text-sm text-neutral-500">No pending applications.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {pending.map((p) => (
        <li key={p.userId} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="font-semibold">{p.user.name ?? p.user.email}</p>
          <p className="mt-1 text-sm"><span className="font-medium">Motivation:</span> {p.motivation}</p>
          <p className="text-sm"><span className="font-medium">Experience:</span> {p.experience}</p>
          <p className="text-sm"><span className="font-medium">Availability:</span> {p.availability}</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => decide(p.userId, "APPROVED")} className="min-h-9 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white">
              Promote to moderator
            </button>
            <button onClick={() => decide(p.userId, "REJECTED")} className="min-h-9 rounded-lg border border-neutral-300 px-4 text-sm dark:border-neutral-700">
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
