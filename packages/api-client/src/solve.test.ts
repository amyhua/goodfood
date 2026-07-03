import { describe, expect, it, vi } from "vitest";
import { createSolverClient, type SolveRequest, type SolveResponse } from "./index";

const req: SolveRequest = {
  foods: [
    {
      id: "oats",
      name: "Oats",
      meal_roles: ["BREAKFAST"],
      per100g: { protein: 2.5 },
      tags: ["grain"],
      is_pantry: false,
      min_grams: 0,
      max_grams: 300,
    },
  ],
  meals: [{ role: "BREAKFAST", required: true }],
  gram_increment: 5,
  seed: 0,
  time_budget_sec: 5,
  mode: "strict",
};

describe("SolverClient.solve", () => {
  it("posts to /solve and returns the typed response", async () => {
    const body: SolveResponse = {
      status: "OPTIMAL",
      feasible: true,
      meals: [{ role: "BREAKFAST", items: [{ food_id: "oats", name: "Oats", grams: 150, from_pantry: false }] }],
      solve_time_ms: 12,
      seed: 0,
      diagnostics: { candidate_count: 1, selected_count: 1 },
    };
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    });
    const client = createSolverClient({ baseUrl: "http://solver", fetch: fetchMock as unknown as typeof fetch });
    const res = await client.solve(req);
    expect(res.status).toBe("OPTIMAL");
    expect(res.meals![0]!.items![0]!.grams).toBe(150);
  });
});
