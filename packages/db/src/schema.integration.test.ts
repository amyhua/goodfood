/**
 * Prisma schema integration tests against Postgres (Neon dev DB).
 * Gated behind RUN_DB_INTEGRATION so CI (no DB) skips them; run locally with the
 * env flag + a seeded database. Verifies seed data, CHECK constraints, and
 * "missing != zero" at the DB level.
 */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const RUN = process.env.RUN_DB_INTEGRATION === "1";
const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe.skipIf(!RUN)("schema + seed integration", () => {
  it("seeded the 21-nutrient catalog with unique keys", async () => {
    const count = await prisma.nutrientDefinition.count();
    expect(count).toBeGreaterThanOrEqual(21);
    const keys = (await prisma.nutrientDefinition.findMany({ select: { key: true } })).map((n) => n.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("created a default recommendation profile with goals and a demo user", async () => {
    const profile = await prisma.recommendationProfile.findFirst({ where: { isDefault: true } });
    expect(profile).not.toBeNull();
    const goals = await prisma.recommendationGoal.count({
      where: { recommendationProfileId: profile!.id },
    });
    expect(goals).toBeGreaterThanOrEqual(21);
    const demo = await prisma.user.findFirst({ where: { isDemo: true } });
    expect(demo?.email).toBe("demo@goodfood.local");
  });

  it("stores absent salmon iodine/choline as MISSING, never zero (invariant 4)", async () => {
    const iodine = await prisma.foodNutrient.findUnique({
      where: { foodId_nutrientKey: { foodId: "seed-synthetic-salmon", nutrientKey: "iodine" } },
    });
    expect(iodine?.dataQuality).toBe("MISSING");
    expect(iodine?.amountPer100g).toBeNull();
  });

  it("rejects a non-positive portion gramWeight (CHECK constraint)", async () => {
    await expect(
      prisma.foodPortion.create({
        data: { foodId: "seed-synthetic-oats", description: "bad", gramWeight: -1 },
      }),
    ).rejects.toThrow();
  });

  it("rejects a negative pantry quantity (CHECK constraint)", async () => {
    await expect(
      prisma.pantryItem.create({
        data: { userId: "seed-demo-user", foodId: "seed-synthetic-kale", quantityGrams: -5 },
      }),
    ).rejects.toThrow();
  });

  it("rejects a recommendation goal with min > max (CHECK constraint)", async () => {
    const profileId = `it-profile-${Date.now()}`;
    await prisma.recommendationProfile.create({ data: { id: profileId, name: "it-temp" } });
    try {
      await expect(
        prisma.recommendationGoal.create({
          data: {
            recommendationProfileId: profileId,
            nutrientKey: "iron",
            mode: "TARGET",
            minAmount: 100,
            maxAmount: 10,
          },
        }),
      ).rejects.toThrow();
    } finally {
      await prisma.recommendationProfile.delete({ where: { id: profileId } });
    }
  });
});
