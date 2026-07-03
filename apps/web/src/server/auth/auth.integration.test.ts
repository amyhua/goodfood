/**
 * Auth + row-level ownership end-to-end (F2, GOO-25). Gated behind RUN_DB_INTEGRATION;
 * needs the Neon DB. `next/headers` cookies() is mocked with an in-memory jar so the full
 * DB-session flow (create → resolve → destroy) runs under vitest. Proves: signup/login,
 * session validity, per-user isolation on plans + shopping lists, and demo-data reassign.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// In-memory cookie jar shared by the mocked next/headers.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));

const RUN = process.env.RUN_DB_INTEGRATION === "1";

import { PrismaClient } from "@goodfood/db";
import { getCurrentUser, login, logout, signUp } from "./service";
import { reassignUserData } from "./demo";
import { assertOwnsPlan, assertOwnsShoppingList } from "@/server/plans/ownership";

const prisma = new PrismaClient();
const cleanup: { users: string[] } = { users: [] };

async function makeUserPlan(userId: string, name: string) {
  return prisma.mealPlan.create({ data: { userId, name } });
}

afterAll(async () => {
  for (const id of cleanup.users) await prisma.user.delete({ where: { id } }).catch(() => {});
  await prisma.$disconnect();
});

beforeEach(() => jar.clear());

describe.skipIf(!RUN)("auth + ownership", () => {
  const stamp = `${process.pid}-${Math.round(performance.now())}`;
  const emailA = `a-${stamp}@itest.local`;
  const emailB = `b-${stamp}@itest.local`;

  it("signs up, sets a session, and resolves the current user", async () => {
    const user = await signUp({ email: emailA, name: "A", password: "supersecret1" });
    cleanup.users.push(user.id);
    expect(jar.get("gf_session")).toBeTruthy();
    const me = await getCurrentUser();
    expect(me?.email).toBe(emailA);
  });

  it("logs out (session destroyed) then logs back in", async () => {
    await logout();
    expect(await getCurrentUser()).toBeNull();
    const user = await login({ email: emailA, password: "supersecret1" });
    expect(user.email).toBe(emailA);
    expect(await getCurrentUser()).not.toBeNull();
  });

  it("rejects a wrong password and duplicate signup", async () => {
    await expect(login({ email: emailA, password: "nope" })).rejects.toMatchObject({ status: 401 });
    await expect(signUp({ email: emailA, password: "supersecret1" })).rejects.toMatchObject({ status: 409 });
  });

  it("enforces per-user ownership on plans", async () => {
    const a = await signUp({ email: emailB, password: "supersecret1" });
    cleanup.users.push(a.id);
    const planB = await makeUserPlan(a.id, "B plan");
    // Owner passes; a different user 404s.
    await expect(assertOwnsPlan(prisma, a.id, planB.id)).resolves.toBeUndefined();
    const other = cleanup.users[0]!;
    await expect(assertOwnsPlan(prisma, other, planB.id)).rejects.toMatchObject({ status: 404 });
  });

  it("isolates saved shopping lists per user", async () => {
    const owner = cleanup.users[1]!;
    const list = await prisma.savedShoppingList.create({
      data: { userId: owner, name: "Groceries", items: [] },
    });
    await expect(assertOwnsShoppingList(prisma, owner, list.id)).resolves.toBeUndefined();
    await expect(assertOwnsShoppingList(prisma, cleanup.users[0]!, list.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("reassigns demo data to a real account safely", async () => {
    const demo = await prisma.user.create({
      data: { email: `demo-${stamp}@itest.local`, isDemo: true },
    });
    cleanup.users.push(demo.id);
    const plan = await makeUserPlan(demo.id, "Demo plan");
    const target = cleanup.users[0]!;
    const moved = await reassignUserData(prisma, demo.id, target);
    expect(moved.mealPlans).toBeGreaterThanOrEqual(1);
    const reloaded = await prisma.mealPlan.findUnique({ where: { id: plan.id } });
    expect(reloaded?.userId).toBe(target);
  });
});
