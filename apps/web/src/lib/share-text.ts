/**
 * Per-platform share intents (F3). Pure + framework-free so it unit-tests without a DOM.
 * Each platform gets text tuned to its norms; Instagram has no web feed-share intent, so we
 * return a copy-ready caption instead of a URL.
 */
export interface ShareContent {
  /** Human title, e.g. the plan's custom name. */
  title: string;
  /** Canonical public URL of the share page. */
  url: string;
  /** One-line honest highlight, e.g. "18/21 nutrient targets met · 2018 kcal". */
  summary: string;
}

const enc = encodeURIComponent;

export function xIntent(c: ShareContent): string {
  const text = `${c.title} — ${c.summary}`;
  return `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(c.url)}`;
}

export function linkedInIntent(c: ShareContent): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${enc(c.url)}`;
}

export function emailIntent(c: ShareContent, subject?: string, message?: string): string {
  const s = subject?.trim() || `Check out this meal plan: ${c.title}`;
  const body = `${message?.trim() ? `${message.trim()}\n\n` : ""}${c.summary}\n\n${c.url}`;
  return `mailto:?subject=${enc(s)}&body=${enc(body)}`;
}

/** Instagram feed posts have no web share-intent — provide a copy-ready caption. */
export function instagramCaption(c: ShareContent): string {
  return `${c.title}\n${c.summary}\n\nMade with goodfood — source-traceable meal plans with a nutrient proof.\n${c.url}`;
}

export function copyText(c: ShareContent): string {
  return c.url;
}
