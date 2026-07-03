import type { MonetizationConfig } from "./config";

/**
 * Pure gating decision (F10). The whole point: when `config.enabled` is false the answer is
 * ALWAYS allowed — the paywall is inert. Premium users are always allowed. Otherwise the free
 * monthly limit for the feature applies.
 */
export interface GateInput {
  config: MonetizationConfig;
  isPremium: boolean;
  monthlyCount: number;
  feature: "plan" | "list";
}

export interface GateResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  priceMonthlyUsd?: number;
}

export function evaluateGate({ config, isPremium, monthlyCount, feature }: GateInput): GateResult {
  if (!config.enabled) return { allowed: true }; // paywall inactive → unrestricted
  if (isPremium) return { allowed: true };
  const limit = feature === "plan" ? config.freeMonthlyPlanLimit : config.freeMonthlyListLimit;
  if (monthlyCount >= limit) {
    return {
      allowed: false,
      reason: `Free plan limit of ${limit} ${feature}s per month reached. Upgrade for unlimited.`,
      limit,
      priceMonthlyUsd: config.priceMonthlyUsd,
    };
  }
  return { allowed: true };
}
