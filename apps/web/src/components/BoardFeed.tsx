"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FeedItem {
  id: string;
  title: string;
  description: string;
  dietTags: string[];
  author: string;
  planName: string;
  durationDays: number;
  likeCount: number;
  saveCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  authorBadge: string | null;
}

const DIETS = ["VEGAN", "VEGETARIAN", "PESCATARIAN", "NONDAIRY", "PALEO", "KETO", "WHOLE_FOODS"];
const label = (d: string) => d.replace("_", " ").toLowerCase();

/** Social board feed (F8): filter by diet, adopt/like/save/report. Only live posts appear. */
export function BoardFeed() {
  const router = useRouter();
  const [diet, setDiet] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const url = diet ? `/api/board?diet=${diet}` : "/api/board";
    const b = await fetch(url).then((r) => r.json());
    setPosts(b.posts ?? []);
    setLoaded(true);
  }, [diet]);

  useEffect(() => {
    load().catch(() => setLoaded(true));
  }, [load]);

  async function act(id: string, action: "like" | "save") {
    const b = await fetch(`/api/board/${id}/${action}`, { method: "POST" }).then((r) => r.json());
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? action === "like"
            ? { ...p, likedByMe: b.liked, likeCount: b.likeCount }
            : { ...p, savedByMe: b.saved, saveCount: b.saveCount }
          : p,
      ),
    );
  }

  async function adopt(id: string) {
    const res = await fetch(`/api/board/${id}/adopt`, { method: "POST" });
    const b = await res.json();
    if (res.ok && b.planId) router.push(`/planner?planId=${b.planId}`);
    else setNote(b.error ?? "Could not adopt");
  }

  async function report(id: string) {
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason?.trim()) return;
    const res = await fetch(`/api/board/${id}/report`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    setNote(res.ok ? "Reported — thank you." : "Could not report.");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setDiet(null)}
          className={`min-h-9 rounded-full border px-3 text-sm ${diet === null ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 dark:border-neutral-700"}`}
        >
          All
        </button>
        {DIETS.map((d) => (
          <button
            key={d}
            onClick={() => setDiet(d)}
            className={`min-h-9 rounded-full border px-3 text-sm capitalize ${diet === d ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 dark:border-neutral-700"}`}
          >
            {label(d)}
          </button>
        ))}
      </div>

      {note && <p className="mb-3 text-sm text-neutral-500">{note}</p>}

      {loaded && posts.length === 0 && (
        <p className="text-sm text-neutral-500">
          No posts yet{diet ? ` for ${label(diet)}` : ""}. Publish one from your plans.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {posts.map((p) => (
          <li key={p.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{p.title}</h2>
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                by {p.author}
                {p.authorBadge && (
                  <span className="rounded-full bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700" title="Verified practitioner">
                    ✓ {p.authorBadge}
                  </span>
                )}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{p.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.dietTags.map((t) => (
                <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600 dark:bg-neutral-800">
                  {label(t)}
                </span>
              ))}
              <span className="text-xs text-neutral-400">· {p.durationDays}-day plan</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <button onClick={() => adopt(p.id)} className="min-h-9 rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700">
                Adopt
              </button>
              <button onClick={() => act(p.id, "like")} className={`min-h-9 px-2 ${p.likedByMe ? "text-rose-600" : "text-neutral-500"}`}>
                ♥ {p.likeCount}
              </button>
              <button onClick={() => act(p.id, "save")} className={`min-h-9 px-2 ${p.savedByMe ? "text-brand-600" : "text-neutral-500"}`}>
                ⭐ {p.saveCount}
              </button>
              <button onClick={() => report(p.id)} className="min-h-9 px-2 text-neutral-400 hover:text-rose-600">
                Report
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
