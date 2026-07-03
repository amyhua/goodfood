import { afterEach, describe, expect, it } from "vitest";
import { buildBoardAnnouncement, isDiscordConfigured, postToDiscord } from "./discord";

describe("discord", () => {
  const original = process.env.DISCORD_WEBHOOK_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.DISCORD_WEBHOOK_URL;
    else process.env.DISCORD_WEBHOOK_URL = original;
  });

  it("builds an announcement with title, author, and tags", () => {
    const { content } = buildBoardAnnouncement({
      title: "Vegan week",
      author: "amy",
      dietTags: ["VEGAN", "WHOLE_FOODS"],
      url: "https://goodfood.app/board",
    });
    expect(content).toContain("Vegan week");
    expect(content).toContain("amy");
    expect(content).toContain("vegan");
    expect(content).toContain("whole foods");
    expect(content).toContain("https://goodfood.app/board");
  });

  it("omits the tag block when there are no tags", () => {
    const { content } = buildBoardAnnouncement({ title: "T", author: "a", dietTags: [] });
    expect(content).not.toContain("[");
  });

  it("is disabled and a no-op when no webhook is configured", async () => {
    delete process.env.DISCORD_WEBHOOK_URL;
    expect(isDiscordConfigured()).toBe(false);
    expect(await postToDiscord({ title: "T", author: "a", dietTags: [] })).toBe(false);
  });
});
