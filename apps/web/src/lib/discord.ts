/**
 * Discord webhook integration (F9). Optional + off by default: the announcement only fires
 * when DISCORD_WEBHOOK_URL is set. `buildBoardAnnouncement` is pure (unit-tested); the
 * poster is best-effort and never throws into the caller, so board publishing never depends
 * on Discord being reachable.
 */
export interface BoardAnnouncementInput {
  title: string;
  author: string;
  dietTags: string[];
  url?: string;
}

export function isDiscordConfigured(): boolean {
  return Boolean(process.env.DISCORD_WEBHOOK_URL);
}

/** The JSON body sent to a Discord "Execute Webhook" endpoint. */
export function buildBoardAnnouncement(input: BoardAnnouncementInput): { content: string } {
  const tags = input.dietTags.length
    ? ` [${input.dietTags.map((t) => t.replace("_", " ").toLowerCase()).join(", ")}]`
    : "";
  const link = input.url ? `\n${input.url}` : "";
  return {
    content: `🥬 **${input.title}** was just shared to the goodfood board by ${input.author}${tags}${link}`,
  };
}

/** Best-effort cross-post. No-op (returns false) when unconfigured; never throws. */
export async function postToDiscord(input: BoardAnnouncementInput): Promise<boolean> {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return false;
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildBoardAnnouncement(input)),
    });
    return res.ok;
  } catch {
    return false;
  }
}
