import { describe, expect, it } from "vitest";
import { configFromEnv, DEFAULT_CONFIG, mergeConfig } from "./config";
import { evaluateGate } from "./gate";

describe("monetization config", () => {
  it("defaults to OFF and unrestricted", () => {
    expect(DEFAULT_CONFIG.enabled).toBe(false);
    expect(DEFAULT_CONFIG.adsEnabled).toBe(false);
  });

  it("stays disabled when no env is set", () => {
    expect(configFromEnv({}).enabled).toBe(false);
  });

  it("reads env overrides", () => {
    const c = configFromEnv({ MONETIZATION_ENABLED: "true", FREE_MONTHLY_PLAN_LIMIT: "3", PREMIUM_PRICE_USD: "7" });
    expect(c.enabled).toBe(true);
    expect(c.freeMonthlyPlanLimit).toBe(3);
    expect(c.priceMonthlyUsd).toBe(7);
  });

  it("mergeConfig ignores undefined/null", () => {
    const c = mergeConfig(DEFAULT_CONFIG, { enabled: undefined, freeMonthlyPlanLimit: 5 });
    expect(c.enabled).toBe(false);
    expect(c.freeMonthlyPlanLimit).toBe(5);
  });
});

describe("evaluateGate", () => {
  const enabled = { ...DEFAULT_CONFIG, enabled: true, freeMonthlyPlanLimit: 2 };

  it("always allows when monetization is disabled (paywall inert)", () => {
    expect(evaluateGate({ config: DEFAULT_CONFIG, isPremium: false, monthlyCount: 9999, feature: "plan" }).allowed).toBe(true);
  });

  it("always allows premium users", () => {
    expect(evaluateGate({ config: enabled, isPremium: true, monthlyCount: 9999, feature: "plan" }).allowed).toBe(true);
  });

  it("allows a free user under the limit", () => {
    expect(evaluateGate({ config: enabled, isPremium: false, monthlyCount: 1, feature: "plan" }).allowed).toBe(true);
  });

  it("blocks a free user at/over the limit with upgrade info", () => {
    const r = evaluateGate({ config: enabled, isPremium: false, monthlyCount: 2, feature: "plan" });
    expect(r.allowed).toBe(false);
    expect(r.limit).toBe(2);
    expect(r.priceMonthlyUsd).toBe(5);
    expect(r.reason).toMatch(/Upgrade/);
  });
});
