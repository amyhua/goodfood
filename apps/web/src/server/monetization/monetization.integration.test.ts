/**
 * Monetization gating end-to-end (F10, GOO-33). Gated behind RUN_DB_INTEGRATION; needs Neon.
 * Proves the critical invariant: disabled => always allowed; and when an admin enables it, free
 * users hit the monthly limit while premium users don't. Restores the singleton setting after.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@goodfood/db";
import { gatePlanCreation, saveMonetizationOverride } from "./service";

const RUN = process.env.RUN_DB_INTEGRATION === "1";
const prisma = new PrismaClient();
const userIds: string[] = [];
let priorSetting: unknown = null;

beforeAll(async () => {
  if (!RUN) return;
  priorSetting = (await prisma.appSetting.findUnique({ where: { id: "singleton" } }))?.data ?? null;
});

afterAll(async () => {
  if (RUN) {
    if (priorSetting == null) await prisma.appSetting.deleteMany({ where: { id: "singleton" } });
    else await prisma.appSetting.update({ where: { id: "singleton" }, data: { data: priorSetting } }).catch(() => {});
    for (const id of userIds) await prisma.user.delete({ where: { id } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe.skipIf(!RUN)("monetization gating", () => {
  const stamp = `${process.pid}-${Math.round(performance.now())}`;

  it("is disabled by default → generation always allowed", async () => {
    await saveMonetizationOverride({ enabled: false });
    const user = await prisma.user.create({ data: { email: `mon-a-${stamp}@itest.local` } });
    userIds.push(user.id);
    for (let i = 0; i < 3; i++) await prisma.mealPlan.create({ data: { userId: user.id, name: `p${i}` } });
    expect((await gatePlanCreation(user.id)).allowed).toBe(true);
  });

  it("when enabled, blocks a free user over the monthly limit but not a premium user", async () => {
    await saveMonetizationOverride({ enabled: true, freeMonthlyPlanLimit: 2 });
    const free = await prisma.user.create({ data: { email: `mon-free-${stamp}@itest.local` } });
    const premium = await prisma.user.create({
      data: { email: `mon-prem-${stamp}@itest.local`, premiumUntil: new Date(Date.now() + 86_400_000) },
    });
    userIds.push(free.id, premium.id);
    for (let i = 0; i < 2; i++) {
      await prisma.mealPlan.create({ data: { userId: free.id, name: `f${i}` } });
      await prisma.mealPlan.create({ data: { userId: premium.id, name: `pr${i}` } });
    }
    const freeGate = await gatePlanCreation(free.id);
    expect(freeGate.allowed).toBe(false);
    expect(freeGate.limit).toBe(2);
    expect((await gatePlanCreation(premium.id)).allowed).toBe(true);
  });

  it("flipping the admin override back off re-opens the gate", async () => {
    await saveMonetizationOverride({ enabled: false });
    const user = userIds[1]!; // the previously-blocked free user
    expect((await gatePlanCreation(user)).allowed).toBe(true);
  });
});
