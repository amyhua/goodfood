import { describe, expect, it, vi } from "vitest";
import { UsdaClient } from "./client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("UsdaClient (mocked fetch — no live calls)", () => {
  it("parses a search response and sends Foundation+SR Legacy by default", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      expect(String(url)).toContain("dataType=Foundation%2CSR+Legacy");
      return jsonResponse({ totalHits: 1, currentPage: 1, totalPages: 1, foods: [{ fdcId: 1, description: "Kale", dataType: "SR Legacy" }] });
    });
    const client = new UsdaClient({ apiKey: "k", fetch: fetchMock as unknown as typeof fetch, backoffMs: 0 });
    const res = await client.search("kale");
    expect(res.foods[0]!.fdcId).toBe(1);
  });

  it("retries on 429 then succeeds", async () => {
    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls++;
      return calls < 3 ? jsonResponse({}, 429) : jsonResponse({ fdcId: 5, description: "x", dataType: "Foundation", foodNutrients: [] });
    });
    const client = new UsdaClient({ apiKey: "k", fetch: fetchMock as unknown as typeof fetch, backoffMs: 0 });
    const food = await client.getFood(5);
    expect(food.fdcId).toBe(5);
    expect(calls).toBe(3);
  });

  it("caches food detail (second read makes no fetch)", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ fdcId: 9, description: "x", dataType: "Foundation", foodNutrients: [] }),
    );
    const client = new UsdaClient({ apiKey: "k", fetch: fetchMock as unknown as typeof fetch, backoffMs: 0 });
    await client.getFood(9);
    await client.getFood(9);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxRetries on persistent 500", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, 500));
    const client = new UsdaClient({ apiKey: "k", fetch: fetchMock as unknown as typeof fetch, backoffMs: 0, maxRetries: 2 });
    await expect(client.getFood(1)).rejects.toThrow(/500/);
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("requires an api key", () => {
    expect(() => new UsdaClient({ apiKey: "" })).toThrow(/apiKey/);
  });
});
