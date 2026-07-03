/**
 * Typed, server-only USDA FoodData Central client (Prompt 3).
 * Bounded timeouts (AbortController), retry with backoff on 429/5xx, and an
 * in-memory detail cache for idempotent repeated reads. `fetch` is injectable so
 * tests never touch the network (invariant: no live external calls in CI).
 */
import { z } from "zod";
import type { FdcFoodDetail, FdcSearchResponse } from "./types";

export interface UsdaClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  /** backoff base in ms (0 in tests to keep them fast) */
  backoffMs?: number;
}

const searchQuerySchema = z.string().trim().min(1).max(200);

export interface SearchOptions {
  dataTypes?: string[]; // default Foundation + SR Legacy
  pageSize?: number;
  pageNumber?: number;
}

export class UsdaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly doFetch: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly backoffMs: number;
  private readonly detailCache = new Map<number, FdcFoodDetail>();

  constructor(opts: UsdaClientOptions) {
    if (!opts.apiKey) throw new Error("USDA client requires an apiKey");
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? "https://api.nal.usda.gov/fdc/v1").replace(/\/$/, "");
    this.doFetch = opts.fetch ?? fetch;
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.maxRetries = opts.maxRetries ?? 3;
    this.backoffMs = opts.backoffMs ?? 300;
  }

  async search(query: string, opts: SearchOptions = {}): Promise<FdcSearchResponse> {
    const q = searchQuerySchema.parse(query);
    const params = new URLSearchParams({
      api_key: this.apiKey,
      query: q,
      dataType: (opts.dataTypes ?? ["Foundation", "SR Legacy"]).join(","),
      pageSize: String(opts.pageSize ?? 10),
      pageNumber: String(opts.pageNumber ?? 1),
    });
    const res = await this.requestWithRetry(`/foods/search?${params.toString()}`);
    return (await res.json()) as FdcSearchResponse;
  }

  async getFood(fdcId: number): Promise<FdcFoodDetail> {
    const cached = this.detailCache.get(fdcId);
    if (cached) return cached;
    const params = new URLSearchParams({ api_key: this.apiKey });
    const res = await this.requestWithRetry(`/food/${fdcId}?${params.toString()}`);
    const detail = (await res.json()) as FdcFoodDetail;
    this.detailCache.set(fdcId, detail);
    return detail;
  }

  private async requestWithRetry(path: string): Promise<Response> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await this.requestOnce(path);
        if (res.status === 429 || res.status >= 500) {
          lastErr = new Error(`USDA ${path} status ${res.status}`);
        } else if (!res.ok) {
          throw new Error(`USDA ${path} status ${res.status}`);
        } else {
          return res;
        }
      } catch (err) {
        lastErr = err;
      }
      if (attempt < this.maxRetries) await this.sleep(this.backoffMs * 2 ** attempt);
    }
    throw lastErr instanceof Error ? lastErr : new Error(`USDA ${path} failed`);
  }

  private async requestOnce(path: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.doFetch(`${this.baseUrl}${path}`, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export function createUsdaClient(opts: UsdaClientOptions): UsdaClient {
  return new UsdaClient(opts);
}
