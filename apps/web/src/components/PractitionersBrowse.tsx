"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Practitioner {
  userId: string;
  name: string;
  roleTitle: string;
  bio: string;
  planCount: number;
}

/** Browse verified practitioners + their shared plans (F12). Plans are adopted from the board. */
export function PractitionersBrowse() {
  const [list, setList] = useState<Practitioner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/practitioners")
      .then((r) => r.json())
      .then((b) => setList(b.practitioners ?? []))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (list.length === 0)
    return (
      <p className="text-sm text-neutral-500">
        No verified practitioners yet.{" "}
        <Link href="/practitioners/apply" className="text-brand-600 underline">
          Apply
        </Link>{" "}
        if you’re a professional.
      </p>
    );

  return (
    <ul className="flex flex-col gap-3">
      {list.map((p) => (
        <li key={p.userId} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{p.name}</span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              ✓ {p.roleTitle}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{p.bio}</p>
          <p className="mt-2 text-xs text-neutral-500">
            {p.planCount} shared {p.planCount === 1 ? "plan" : "plans"} ·{" "}
            <Link href="/board" className="text-brand-600 underline">
              browse on the board
            </Link>
          </p>
        </li>
      ))}
    </ul>
  );
}
