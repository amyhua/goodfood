import "server-only";
import { prisma } from "@goodfood/db";
import { configFromEnv, mergeConfig, type MonetizationConfig } from "./config";
import { evaluateGate, type GateResult } from "./gate";

const SETTING_ID = "singleton";

/** Effective config = env layered with the DB admin override (if any). */
export async function getMonetizationConfig(): Promise<MonetizationConfig> {
  const base = configFromEnv();
  const row = await prisma.appSetting.findUnique({ where: { id: SETTING_ID } });
  if (!row) return base;
  const override = (row.data as { monetization?: Partial<MonetizationConfig> })?.monetization ?? {};
  return mergeConfig(base, override);
}

/** Persist an admin override (F10 admin surface). Only the known keys are stored. */
export async function saveMonetizationOverride(override: Partial<MonetizationConfig>): Promise<void> {
  const existing = await prisma.appSetting.findUnique({ where: { id: SETTING_ID } });
  const prev = ((existing?.data as { monetization?: Partial<MonetizationConfig> })?.monetization ?? {});
  const data = { monetization: { ...prev, ...override } };
  await prisma.appSetting.upsert({
    where: { id: SETTING_ID },
    update: { data },
    create: { id: SETTING_ID, data },
  });
}

function isPremium(user: { premiumUntil: Date | null } | null): boolean {
  return Boolean(user?.premiumUntil && user.premiumUntil.getTime() > Date.now());
}

/** Count how many plans a user created in the current calendar month (usage metering). */
export async function monthlyPlanCount(userId: string): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return prisma.mealPlan.count({ where: { userId, createdAt: { gte: start } } });
}

/** Whether `userId` may create another plan right now. Allowed unless monetization is enabled,
 *  the user is non-premium, and they've hit the monthly limit. */
export async function gatePlanCreation(userId: string): Promise<GateResult> {
  const config = await getMonetizationConfig();
  if (!config.enabled) return { allowed: true };
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumUntil: true },
  });
  return evaluateGate({
    config,
    isPremium: isPremium(user),
    monthlyCount: await monthlyPlanCount(userId),
    feature: "plan",
  });
}
