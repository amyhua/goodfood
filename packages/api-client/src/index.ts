/**
 * @goodfood/api-client — typed client for the Python solver service.
 * Request/response types are generated from the solver's OpenAPI contract into
 * ./solver-schema.ts (regenerate via `pnpm --filter @goodfood/api-client gen:solver`).
 */
import { z } from "zod";
import type { components } from "./solver-schema";

export type * from "./solver-schema";

/** Solver contract types, derived from the generated OpenAPI schema. */
export type SolveRequest = components["schemas"]["SolveRequest"];
export type SolveResponse = components["schemas"]["SolveResponse"];
export type CandidateFood = components["schemas"]["CandidateFood"];
export type NutrientConstraint = components["schemas"]["NutrientConstraint"];

export const SolverHealthSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  version: z.string(),
});
export type SolverHealth = z.infer<typeof SolverHealthSchema>;

export interface SolverClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export class SolverClient {
  private readonly baseUrl: string;
  private readonly doFetch: typeof fetch;
  private readonly timeoutMs: number;

  constructor(opts: SolverClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.doFetch = opts.fetch ?? fetch;
    this.timeoutMs = opts.timeoutMs ?? 10_000;
  }

  async health(): Promise<SolverHealth> {
    const res = await this.request("/health");
    return SolverHealthSchema.parse(await res.json());
  }

  /** POST /solve — returns selected foods/grams + diagnostics (TS computes the proof). */
  async solve(req: SolveRequest): Promise<SolveResponse> {
    const res = await this.request("/solve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
    return (await res.json()) as SolveResponse;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.doFetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Solver ${path} failed: ${res.status}`);
      return res;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createSolverClient(opts: SolverClientOptions): SolverClient {
  return new SolverClient(opts);
}
