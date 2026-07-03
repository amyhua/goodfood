/**
 * Monetization config (F10). **OFF by default** — every field below defaults to "free and
 * unrestricted". Resolution order: DEFAULT_CONFIG ← env overrides ← DB AppSetting override
 * (admin toggle). The pure pieces (DEFAULT_CONFIG, configFromEnv, mergeConfig) are unit-tested;
 * getMonetizationConfig() layers the DB override on top.
 */
export interface MonetizationConfig {
  /** Master switch. false => paywall inactive, no metering, app fully free. */
  enabled: boolean;
  freeMonthlyPlanLimit: number;
  freeMonthlyListLimit: number;
  priceMonthlyUsd: number;
  premiumFeatures: string[];
  /** Ad slots are a separate switch, also off by default. */
  adsEnabled: boolean;
}

export const DEFAULT_CONFIG: MonetizationConfig = {
  enabled: false,
  freeMonthlyPlanLimit: 20,
  freeMonthlyListLimit: 20,
  priceMonthlyUsd: 5,
  premiumFeatures: ["unlimited-plans", "unlimited-lists"],
  adsEnabled: false,
};

function bool(v: string | undefined): boolean | undefined {
  if (v == null) return undefined;
  return v === "1" || v.toLowerCase() === "true";
}
function int(v: string | undefined): number | undefined {
  if (v == null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Overrides sourced from environment variables (all optional). Pure. */
export function configFromEnv(env: Record<string, string | undefined> = process.env): MonetizationConfig {
  return mergeConfig(DEFAULT_CONFIG, {
    enabled: bool(env.MONETIZATION_ENABLED),
    freeMonthlyPlanLimit: int(env.FREE_MONTHLY_PLAN_LIMIT),
    freeMonthlyListLimit: int(env.FREE_MONTHLY_LIST_LIMIT),
    priceMonthlyUsd: int(env.PREMIUM_PRICE_USD),
    adsEnabled: bool(env.ADS_ENABLED),
  });
}

/** Layer a partial override on top of a base config (undefined = keep base). Pure. */
export function mergeConfig(
  base: MonetizationConfig,
  override: Partial<MonetizationConfig>,
): MonetizationConfig {
  const out = { ...base };
  for (const key of Object.keys(override) as (keyof MonetizationConfig)[]) {
    const v = override[key];
    if (v !== undefined && v !== null) (out as Record<string, unknown>)[key] = v;
  }
  return out;
}
