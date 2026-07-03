/**
 * Sharing service end-to-end (F3, GOO-26). Gated behind RUN_DB_INTEGRATION; needs Neon.
 * Proves opt-in ownership, idempotency, public resolution, revocation, and that a revoked
 * or non-owned share never resolves (privacy).
 */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@goodfood/db";
import { createShare, resolveShareBySlug, revokeShare } from "./service";

const RUN = process.env.RUN_DB_INTEGRATION === "1";
const prisma = new PrismaClient();
const userIds: string[] = [];

afterAll(async () => {
  for (const id of userIds) await prisma.user.delete({ where: { id } }).catch(() => {});
  await prisma.$disconnect();
});

describe.skipIf(!RUN)("shares service", () => {
  const stamp = `${process.pid}-${Math.round(performance.now())}`;

  it("opt-in share is owner-gated, idempotent, resolvable, and revocable", async () => {
    const owner = await prisma.user.create({ data: { email: `sh-owner-${stamp}@itest.local` } });
    const other = await prisma.user.create({ data: { email: `sh-other-${stamp}@itest.local` } });
    userIds.push(owner.id, other.id);
    const plan = await prisma.mealPlan.create({ data: { userId: owner.id, name: "Shared plan" } });

    // A non-owner cannot share someone else's plan.
    await expect(createShare(other.id, { kind: "PLAN", id: plan.id })).rejects.toMatchObject({
      status: 404,
    });

    // Owner shares; second call is idempotent (same row).
    const share = await createShare(owner.id, { kind: "PLAN", id: plan.id });
    expect(share.slug).toBeTruthy();
    const again = await createShare(owner.id, { kind: "PLAN", id: plan.id });
    expect(again.id).toBe(share.id);

    // Public resolution works while live.
    const live = await resolveShareBySlug(share.slug);
    expect(live?.mealPlanId).toBe(plan.id);

    // Non-owner cannot revoke; owner can; then it stops resolving.
    await expect(revokeShare(other.id, share.slug)).rejects.toMatchObject({ status: 404 });
    await revokeShare(owner.id, share.slug);
    expect(await resolveShareBySlug(share.slug)).toBeNull();
  });

  it("shares a saved shopping list too", async () => {
    const owner = await prisma.user.create({ data: { email: `sh-list-${stamp}@itest.local` } });
    userIds.push(owner.id);
    const list = await prisma.savedShoppingList.create({
      data: { userId: owner.id, name: "Groceries", items: [{ foodName: "Kale", grams: 200, category: "Vegetables", source: {} }] },
    });
    const share = await createShare(owner.id, { kind: "LIST", id: list.id });
    const live = await resolveShareBySlug(share.slug);
    expect(live?.savedShoppingListId).toBe(list.id);
    expect(live?.savedShoppingList?.name).toBe("Groceries");
  });
});
