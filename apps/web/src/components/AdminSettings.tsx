"use client";

import { useEffect, useState } from "react";

interface Config {
  enabled: boolean;
  freeMonthlyPlanLimit: number;
  freeMonthlyListLimit: number;
  priceMonthlyUsd: number;
  adsEnabled: boolean;
}

/** Admin surface (F10) to view/flip monetization at runtime. The API enforces admin access
 *  (ADMIN_EMAILS); this UI just reflects the result. */
export function AdminSettings() {
  const [config, setConfig] = useState<Config | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "forbidden">("loading");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        if (r.status === 403) return setStatus("forbidden");
        const b = await r.json();
        setConfig(b.config);
        setStatus("ok");
      })
      .catch(() => setStatus("forbidden"));
  }, []);

  async function update(patch: Partial<Config>) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const b = await res.json();
    if (res.ok) {
      setConfig(b.config);
      setNote("Saved.");
    } else {
      setNote(b.error ?? "Save failed");
    }
  }

  if (status === "loading") return <p className="text-sm text-neutral-500">Loading…</p>;
  if (status === "forbidden" || !config)
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Admin access required. Add your email to <code>ADMIN_EMAILS</code> and sign in.
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-lg border p-3 text-sm ${config.enabled ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"}`}
      >
        Monetization is <strong>{config.enabled ? "ON" : "OFF"}</strong>.{" "}
        {config.enabled ? "Free-tier limits apply." : "The app is fully free and unrestricted."}
      </div>

      <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 dark:border-neutral-800">
        <span>Paywall enabled</span>
        <input type="checkbox" checked={config.enabled} onChange={(e) => update({ enabled: e.target.checked })} className="size-5" />
      </label>

      <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 dark:border-neutral-800">
        <span>Ads enabled (build-time flag)</span>
        <input type="checkbox" checked={config.adsEnabled} onChange={(e) => update({ adsEnabled: e.target.checked })} className="size-5" />
      </label>

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm">Free plans / month</span>
        <input
          type="number"
          min={0}
          defaultValue={config.freeMonthlyPlanLimit}
          onBlur={(e) => update({ freeMonthlyPlanLimit: Number(e.target.value) })}
          className="min-h-10 w-24 rounded-lg border border-neutral-300 px-3 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm">Price / month (USD)</span>
        <input
          type="number"
          min={0}
          defaultValue={config.priceMonthlyUsd}
          onBlur={(e) => update({ priceMonthlyUsd: Number(e.target.value) })}
          className="min-h-10 w-24 rounded-lg border border-neutral-300 px-3 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      {note && <p className="text-sm text-neutral-500">{note}</p>}
    </div>
  );
}
