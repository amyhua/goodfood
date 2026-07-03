/**
 * Import idempotency + provenance against Postgres. Gated behind RUN_DB_INTEGRATION
 * (no live USDA calls — the client is stubbed with the fixture). Verifies a second
 * import converges to the same rows, and that absent iodine/choline stay MISSING.
 */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@goodfood/db";
import fixture from "./__fixtures__/food-detail.json";
import type { UsdaClient } from "./client";
import { importFdcFood } from "./import";
import type { FdcFoodDetail } from "./types";

const RUN = process.env.RUN_DB_INTEGRATION === "1";
const prisma = new PrismaClient();
const stubClient = { getFood: async () => fixture as FdcFoodDetail } as unknown as UsdaClient;

afterAll(async () => {
  await prisma.food.deleteMany({ where: { fdcId: 999001 } });
  await prisma.$disconnect();
});

describe.skipIf(!RUN)("importFdcFood idempotency", () => {
  it("creates once, updates on re-import, and keeps missing != zero", async () => {
    await prisma.food.deleteMany({ where: { fdcId: 999001 } });

    const first = await importFdcFood(prisma, stubClient, 999001, "2026-07-03T00:00:00.000Z");
    expect(first.created).toBe(true);

    const second = await importFdcFood(prisma, stubClient, 999001, "2026-07-03T01:00:00.000Z");
    expect(second.created).toBe(false);
    expect(second.foodId).toBe(first.foodId);

    // Exactly one Food row for this fdcId (idempotent).
    expect(await prisma.food.count({ where: { fdcId: 999001 } })).toBe(1);

    // Protein present and source-backed.
    const protein = await prisma.foodNutrient.findUnique({
      where: { foodId_nutrientKey: { foodId: first.foodId, nutrientKey: "protein" } },
    });
    expect(protein?.amountPer100g?.toString()).toBe("22.1");
    expect(protein?.nutrientSourceId).toBe("1003");

    // Absent iodine stored as MISSING, never zero.
    const iodine = await prisma.foodNutrient.findUnique({
      where: { foodId_nutrientKey: { foodId: first.foodId, nutrientKey: "iodine" } },
    });
    expect(iodine?.dataQuality).toBe("MISSING");
    expect(iodine?.amountPer100g).toBeNull();

    // Portions replaced wholesale, not duplicated.
    expect(await prisma.foodPortion.count({ where: { foodId: first.foodId } })).toBe(2);

    // Raw provenance retained.
    const food = await prisma.food.findUnique({ where: { id: first.foodId } });
    expect((food?.rawSource as { fdcId: number }).fdcId).toBe(999001);
  });
});
