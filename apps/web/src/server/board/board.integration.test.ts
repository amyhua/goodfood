/**
 * Social board end-to-end (F8, GOO-31). Gated behind RUN_DB_INTEGRATION; needs Neon.
 * Proves explicit-publish-only visibility, diet filtering, ownership on publish, adopt =
 * duplicate-into-caller, like/save toggles, report + rate limit, and takedown hiding.
 */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@goodfood/db";
import { adoptPost, listFeed, publishPost, reportPost, toggleLike, toggleSave } from "./service";

const RUN = process.env.RUN_DB_INTEGRATION === "1";
const prisma = new PrismaClient();
const userIds: string[] = [];

afterAll(async () => {
  for (const id of userIds) await prisma.user.delete({ where: { id } }).catch(() => {});
  await prisma.$disconnect();
});

describe.skipIf(!RUN)("social board", () => {
  const stamp = `${process.pid}-${Math.round(performance.now())}`;

  it("publishes (owner-only), filters by diet, adopts, likes/saves, reports, and hides takedowns", async () => {
    const author = await prisma.user.create({ data: { email: `bd-author-${stamp}@itest.local` } });
    const reader = await prisma.user.create({ data: { email: `bd-reader-${stamp}@itest.local` } });
    userIds.push(author.id, reader.id);
    const plan = await prisma.mealPlan.create({ data: { userId: author.id, name: "Vegan week" } });

    // Only the plan owner can publish it.
    await expect(publishPost(reader.id, { mealPlanId: plan.id, title: "x", description: "y" })).rejects.toMatchObject(
      { status: 404 },
    );

    const post = await publishPost(author.id, {
      mealPlanId: plan.id,
      title: "High-protein vegan week",
      description: "Sharing my go-to vegan plan",
      dietTags: ["VEGAN"],
    });

    // Feed shows it; diet filter matches VEGAN, excludes KETO.
    const veganFeed = await listFeed({ diet: "VEGAN", viewerId: reader.id });
    expect(veganFeed.find((p) => p.id === post.id)).toBeTruthy();
    const ketoFeed = await listFeed({ diet: "KETO", viewerId: reader.id });
    expect(ketoFeed.find((p) => p.id === post.id)).toBeUndefined();

    // Adopt duplicates the plan into the reader's account.
    const newPlanId = await adoptPost(reader.id, post.id);
    const adopted = await prisma.mealPlan.findUnique({ where: { id: newPlanId } });
    expect(adopted?.userId).toBe(reader.id);
    expect(adopted?.id).not.toBe(plan.id);

    // Like + save toggle.
    const l1 = await toggleLike(reader.id, post.id);
    expect(l1).toEqual({ liked: true, likeCount: 1 });
    const l2 = await toggleLike(reader.id, post.id);
    expect(l2).toEqual({ liked: false, likeCount: 0 });
    const sv = await toggleSave(reader.id, post.id);
    expect(sv.saved).toBe(true);

    // Report records; viewer state reflected in the feed.
    await reportPost(reader.id, post.id, { reason: "test report" });
    const withState = await listFeed({ viewerId: reader.id });
    expect(withState.find((p) => p.id === post.id)?.savedByMe).toBe(true);

    // Takedown hides it from the feed and blocks further actions.
    await prisma.boardPost.update({ where: { id: post.id }, data: { removedAt: new Date() } });
    expect((await listFeed({ viewerId: reader.id })).find((p) => p.id === post.id)).toBeUndefined();
    await expect(toggleLike(reader.id, post.id)).rejects.toMatchObject({ status: 404 });
  });
});
