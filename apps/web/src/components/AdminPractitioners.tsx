"use client";

import { useCallback, useEffect, useState } from "react";

interface Pending {
  userId: string;
  roleTitle: string;
  credentials: string;
  bio: string;
  user: { email: string; name: string | null };
}

/** Admin review of practitioner applications (F12). API enforces admin (ADMIN_EMAILS). */
export function AdminPractitioners() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "forbidden">("loading");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/practitioners");
    if (res.status === 403) return setStatus("forbidden");
    const b = await res.json();
    setPending(b.pending ?? []);
    setStatus("ok");
  }, []);

  useEffect(() => {
    load().catch(() => setStatus("forbidden"));
  }, [load]);

  async function decide(userId: string, decision: "VERIFIED" | "REJECTED") {
    await fetch("/api/admin/practitioners", {
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
        Admin access required. Add your email to <code>ADMIN_EMAILS</code> and sign in.
      </p>
    );
  if (pending.length === 0) return <p className="text-sm text-neutral-500">No pending applications.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {pending.map((p) => (
        <li key={p.userId} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="font-semibold">
            {p.user.name ?? p.user.email} — {p.roleTitle}
          </p>
          <p className="mt-1 text-sm text-neutral-500">{p.user.email}</p>
          <p className="mt-2 text-sm">
            <span className="font-medium">Credentials:</span> {p.credentials}
          </p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{p.bio}</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => decide(p.userId, "VERIFIED")} className="min-h-9 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white">
              Verify
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
