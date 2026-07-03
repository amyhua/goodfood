import { describe, expect, it, vi } from "vitest";
import { createSolverClient } from "./index";

describe("api-client", () => {
  it("parses a healthy solver response", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "ok", service: "solver", version: "0.1.0" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createSolverClient({ baseUrl: "http://solver", fetch: mockFetch });
    await expect(client.health()).resolves.toEqual({
      status: "ok",
      service: "solver",
      version: "0.1.0",
    });
  });

  it("throws on non-2xx", async () => {
    const mockFetch = vi.fn(async () => new Response("no", { status: 503 }));
    const client = createSolverClient({ baseUrl: "http://solver", fetch: mockFetch });
    await expect(client.health()).rejects.toThrow(/503/);
  });
});
