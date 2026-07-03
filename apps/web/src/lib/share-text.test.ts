import { describe, expect, it } from "vitest";
import {
  copyText,
  emailIntent,
  instagramCaption,
  linkedInIntent,
  xIntent,
  type ShareContent,
} from "./share-text";

const c: ShareContent = {
  title: "High-protein day",
  url: "https://goodfood.app/s/abc123",
  summary: "18/21 targets met · 2018 kcal",
};

describe("share-text", () => {
  it("X intent encodes text + url", () => {
    const u = new URL(xIntent(c));
    expect(u.hostname).toBe("twitter.com");
    expect(u.searchParams.get("url")).toBe(c.url);
    expect(u.searchParams.get("text")).toContain("High-protein day");
  });

  it("LinkedIn intent shares the canonical url", () => {
    const u = new URL(linkedInIntent(c));
    expect(u.hostname).toBe("www.linkedin.com");
    expect(u.searchParams.get("url")).toBe(c.url);
  });

  it("email intent carries custom subject + message and the url in the body", () => {
    const u = new URL(emailIntent(c, "My subject", "Hi there"));
    expect(u.protocol).toBe("mailto:");
    expect(u.searchParams.get("subject")).toBe("My subject");
    const body = u.searchParams.get("body")!;
    expect(body).toContain("Hi there");
    expect(body).toContain(c.url);
  });

  it("email intent falls back to a default subject", () => {
    const u = new URL(emailIntent(c));
    expect(u.searchParams.get("subject")).toContain("High-protein day");
  });

  it("Instagram caption includes title, summary, and url (copy-ready)", () => {
    const cap = instagramCaption(c);
    expect(cap).toContain("High-protein day");
    expect(cap).toContain("18/21");
    expect(cap).toContain(c.url);
  });

  it("copyText returns just the url", () => {
    expect(copyText(c)).toBe(c.url);
  });
});
