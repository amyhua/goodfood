import "server-only";
import { createSolverClient, type SolverClient } from "@goodfood/api-client";

/** Solver client from server env (SOLVER_URL). Server-only. */
export function solverClient(): SolverClient {
  const baseUrl = process.env.SOLVER_URL ?? "http://localhost:8000";
  return createSolverClient({ baseUrl, timeoutMs: 20_000 });
}
