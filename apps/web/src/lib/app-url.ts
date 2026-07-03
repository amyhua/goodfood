/**
 * Public base URL for canonical + share links (F3). Reads NEXT_PUBLIC_APP_URL (inlined on
 * the client) and falls back to localhost for dev. Trailing slash normalized off.
 */
export function appBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function shareUrl(slug: string): string {
  return `${appBaseUrl()}/s/${slug}`;
}
