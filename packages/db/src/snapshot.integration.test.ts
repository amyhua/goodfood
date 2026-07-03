/**
 * Proves saved-plan snapshots are immutable under later food-data edits (invariant 5).
 * Gated behind RUN_DB_INTEGRATION. Creates a throwaway plan + revision whose
 * snapshotJson freezes a food's per-100g value, then edits that food's live nutrient
 * and asserts the revision snapshot is unchanged.
 */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const RUN = process.env.RUN_DB_INTEGRATION === "1";
const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe.skipIf(!RUN)("saved-plan snapshot immutability", () => {
  it("freezes nutrient values at generation time regardless of later food edits", async () => {
    const suffix = `${Date.now()}`;
    const foodId = `it-food-${suffix}`;
    const planId = `it-plan-${suffix}`;

    // A throwaway synthetic food with a known protein value.
    await prisma.food.create({
      data: {
        id: foodId,
        source: "SYNTHETIC",
        name: "IT snapshot food",
        isSynthetic: true,
        nutrients: {
          create: [{ nutrientKey: "protein", amountPer100g: 20, unit: "g", dataQuality: "ESTIMATED" }],
        },
      },
    });

    // A plan whose revision snapshot captures the value used (20 g / 100 g).
    await prisma.mealPlan.create({
      data: {
        id: planId,
        userId: "seed-demo-user",
        name: "IT snapshot plan",
        revisions: {
          create: [
            {
              revisionNumber: 1,
              snapshotJson: {
                ingredients: [{ foodId, grams: 150, per100g: { protein: 20 } }],
              },
              nutrientSnapshots: {
                create: [
                  {
                    scope: "DAY",
                    dayIndex: 0,
                    nutrientKey: "protein",
                    mode: "MINIMUM",
                    minAmount: 25,
                    consumedAmount: 30, // 20 * 150 / 100
                    unit: "g",
                    status: "MET",
                    confidence: "COMPLETE",
                  },
                ],
              },
            },
          ],
        },
      },
    });

    try {
      // Mutate the live food nutrient AFTER the snapshot was taken.
      await prisma.foodNutrient.updateMany({
        where: { foodId, nutrientKey: "protein" },
        data: { amountPer100g: 5 },
      });

      const rev = await prisma.planRevision.findFirst({
        where: { mealPlanId: planId },
        include: { nutrientSnapshots: true },
      });
      const snap = rev!.snapshotJson as { ingredients: { per100g: { protein: number } }[] };

      // Snapshot preserves the original 20 g, not the mutated 5 g.
      expect(snap.ingredients[0]!.per100g.protein).toBe(20);
      expect(rev!.nutrientSnapshots[0]!.consumedAmount?.toString()).toBe("30");

      // And the live food indeed changed — proving the snapshot is decoupled.
      const live = await prisma.foodNutrient.findFirst({ where: { foodId, nutrientKey: "protein" } });
      expect(live!.amountPer100g?.toString()).toBe("5");
    } finally {
      await prisma.mealPlan.delete({ where: { id: planId } });
      await prisma.food.delete({ where: { id: foodId } });
    }
  });
});
