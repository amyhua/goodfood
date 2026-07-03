/**
 * Practitioner verification end-to-end (F12, GOO-35). Gated behind RUN_DB_INTEGRATION; Neon.
 * Proves apply→PENDING, admin verify sets VERIFIED + User.role + badge in the board feed, only
 * verified are listed, and reject resets the role.
 */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@goodfood/db";
import {
  applyPractitioner,
  decidePractitioner,
  listPendingApplications,
  listVerifiedPractitioners,
} from "./service";
import { listFeed } from "@/server/board/service";

const RUN = process.env.RUN_DB_INTEGRATION === "1";
const prisma = new PrismaClient();
const userIds: string[] = [];

afterAll(async () => {
  for (const id of userIds) await prisma.user.delete({ where: { id } }).catch(() => {});
  await prisma.$disconnect();
});

describe.skipIf(!RUN)("practitioners", () => {
  const stamp = `${process.pid}-${Math.round(performance.now())}`;

  it("apply → verify sets role + badge; only verified are listed; reject resets", async () => {
    const pro = await prisma.user.create({ data: { email: `pract-${stamp}@itest.local`, name: "Dr Green" } });
    userIds.push(pro.id);

    const app = await applyPractitioner(pro.id, {
      role: "DIETITIAN",
      roleTitle: "Registered Dietitian",
      credentials: "RD #12345",
      bio: "Plant-forward RD",
    });
    expect(app.status).toBe("PENDING");
    expect((await listPendingApplications()).some((p) => p.userId === pro.id)).toBe(true);
    // Not listed until verified.
    expect((await listVerifiedPractitioners()).some((p) => p.userId === pro.id)).toBe(false);

    await decidePractitioner(pro.id, "VERIFIED");
    const user = await prisma.user.findUnique({ where: { id: pro.id } });
    expect(user?.role).toBe("DIETITIAN");
    expect((await listVerifiedPractitioners()).some((p) => p.userId === pro.id)).toBe(true);

    // Board feed surfaces the verified badge on this author's posts.
    const plan = await prisma.mealPlan.create({ data: { userId: pro.id, name: "RD plan" } });
    await prisma.boardPost.create({
      data: { authorId: pro.id, mealPlanId: plan.id, title: "RD week", description: "balanced", dietTags: [] },
    });
    const feed = await listFeed({});
    const post = feed.find((p) => p.title === "RD week");
    expect(post?.authorBadge).toBe("Registered Dietitian");

    // Reject path resets the role to MEMBER.
    await decidePractitioner(pro.id, "REJECTED");
    const reset = await prisma.user.findUnique({ where: { id: pro.id } });
    expect(reset?.role).toBe("MEMBER");
    expect((await listVerifiedPractitioners()).some((p) => p.userId === pro.id)).toBe(false);
  });
});
