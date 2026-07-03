/**
 * @goodfood/api-client — typed client for the Python solver service.
 * Prompt 1 ships the health() call + a typed client shell; Prompt 5 generates
 * the full request/response types from the solver's OpenAPI contract.
 */
import { z } from "zod";

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
