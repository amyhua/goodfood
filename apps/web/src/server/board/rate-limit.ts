import { AuthError } from "@/server/auth/service";

/** Anti-abuse limits for the social board (F8). DB-count based so it's serverless-safe. */
export const BOARD_LIMITS = {
  postsPerHour: 10,
  reportsPerHour: 30,
} as const;

export const ONE_HOUR_MS = 60 * 60 * 1000;

/** Throw 429 when `recentCount` (rows in the trailing window) has reached `max`. Pure. */
export function assertUnderLimit(recentCount: number, max: number, what: string): void {
  if (recentCount >= max) {
    throw new AuthError(`Rate limit reached: too many ${what}. Try again later.`, 429);
  }
}
