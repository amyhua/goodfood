import { API_URL } from "./config";

/**
 * Thin client over the goodfood REST API (F5). Reuses the exact web endpoints — auth uses
 * the same cookie session (iOS URLSession persists cookies automatically, so no token
 * plumbing is needed). Every method throws on a non-2xx with the server's error message.
 */
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

export interface PlanSummary {
  id: string;
  name: string;
  status: string;
  durationDays: number;
  updatedAt: string;
}

export interface ProofRow {
  nutrientKey: string;
  mode: string;
  unit: string;
  consumed: number | null;
  target: number | null;
  min: number | null;
  max: number | null;
  percentOfTarget: number | null;
  status: string;
  confidence: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body;
}

export const api = {
  signup: (email: string, password: string, name?: string) =>
    request<{ user: PublicUser }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request<{ user: PublicUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ user: PublicUser | null }>("/api/auth/me"),
  listPlans: () => request<{ authenticated: boolean; plans: PlanSummary[] }>("/api/plans"),
  generate: () =>
    request<{ feasible: boolean; planId?: string }>("/api/plans/generate", {
      method: "POST",
      body: JSON.stringify({ name: "Mobile plan", durationDays: 1, seed: 0 }),
    }),
  proof: (planId: string) =>
    request<{ planId: string; proof: ProofRow[] }>(`/api/plans/${planId}/proof`),
};
