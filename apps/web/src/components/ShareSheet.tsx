"use client";

import { useState } from "react";
import {
  copyText,
  emailIntent,
  instagramCaption,
  linkedInIntent,
  xIntent,
  type ShareContent,
} from "@/lib/share-text";

/**
 * Share panel (F3). Opts a plan/list into public sharing (POST /api/shares), then offers
 * per-platform actions: Copy Link, X, LinkedIn, Email (custom subject+message), Instagram
 * (copy caption + download the generated image), and Revoke. Sharing is explicit and
 * revocable — nothing is public until the user clicks Share.
 */
export function ShareSheet({
  kind,
  id,
  title,
  summary,
}: {
  kind: "PLAN" | "LIST";
  id: string;
  title: string;
  summary: string;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  async function startShare() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Could not create share");
      setUrl(body.url);
      setSlug(body.slug);
      setOpen(true);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not create share");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!slug) return;
    await fetch(`/api/shares/${slug}`, { method: "DELETE" });
    setOpen(false);
    setUrl(null);
    setSlug(null);
    setNote("Share revoked — the public page now 404s.");
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNote(`${label} copied.`);
    } catch {
      setNote("Copy failed — select and copy manually.");
    }
  }

  const content: ShareContent | null = url ? { title, url, summary } : null;

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={startShare}
        disabled={busy}
        className="min-h-9 rounded px-2 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-60"
      >
        {busy ? "Sharing…" : "Share"}
      </button>

      {open && content && (
        <div className="mt-2 w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-3 flex items-center gap-2">
            <input
              readOnly
              value={content.url}
              className="min-h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <button
              type="button"
              onClick={() => copy(copyText(content), "Link")}
              className="min-h-10 shrink-0 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white"
            >
              Copy
            </button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <a
              href={xIntent(content)}
              target="_blank"
              rel="noreferrer"
              className="min-h-10 rounded-lg border border-neutral-300 px-3 text-center text-sm font-medium leading-10 dark:border-neutral-700"
            >
              Share on X
            </a>
            <a
              href={linkedInIntent(content)}
              target="_blank"
              rel="noreferrer"
              className="min-h-10 rounded-lg border border-neutral-300 px-3 text-center text-sm font-medium leading-10 dark:border-neutral-700"
            >
              LinkedIn
            </a>
          </div>

          <fieldset className="mb-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
            <legend className="px-1 text-xs font-medium text-neutral-500">Email</legend>
            <input
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mb-2 min-h-9 w-full rounded border border-neutral-300 px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <textarea
              placeholder="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="mb-2 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <a
              href={emailIntent(content, subject, message)}
              className="inline-block min-h-9 rounded bg-neutral-800 px-3 text-sm font-medium leading-9 text-white dark:bg-neutral-200 dark:text-neutral-900"
            >
              Open email
            </a>
          </fieldset>

          <fieldset className="mb-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
            <legend className="px-1 text-xs font-medium text-neutral-500">Instagram</legend>
            <p className="mb-2 text-xs text-neutral-500">
              Instagram has no web share for feed posts — copy the caption and download the image.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(instagramCaption(content), "Caption")}
                className="min-h-9 rounded border border-neutral-300 px-3 text-sm font-medium dark:border-neutral-700"
              >
                Copy caption
              </button>
              {slug && (
                <a
                  href={`/s/${slug}/opengraph-image`}
                  download={`goodfood-${slug}.png`}
                  className="min-h-9 rounded border border-neutral-300 px-3 text-sm font-medium leading-9 dark:border-neutral-700"
                >
                  Download image
                </a>
              )}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={revoke}
            className="min-h-9 rounded px-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
          >
            Revoke share
          </button>
        </div>
      )}

      {note && <p className="mt-1 text-xs text-neutral-500">{note}</p>}
    </div>
  );
}
