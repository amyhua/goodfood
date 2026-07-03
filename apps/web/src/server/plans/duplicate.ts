import "server-only";
import type { PrismaClient } from "@goodfood/db";
import { getPlan } from "./read";

/**
 * Clone a plan (and its latest immutable revision + nutrient snapshots) into `ownerId`'s
 * account. Snapshots are copied verbatim so the adopted plan keeps the same immutable proof
 * (invariant: saved-plan snapshots are immutable). Returns the new plan id.
 */
export async function duplicatePlan(
  prisma: PrismaClient,
  srcPlanId: string,
  ownerId: string,
  name?: string,
): Promise<string> {
  const src = await getPlan(prisma, srcPlanId);
  if (!src) throw new Error("source plan not found");
  const rev = src.revisions[0];

  const copy = await prisma.$transaction(async (tx) => {
    const plan = await tx.mealPlan.create({
      data: {
        userId: ownerId,
        name: name ?? `Copy of ${src.name}`,
        durationDays: src.durationDays,
        status: "DRAFT",
        pantryMode: src.pantryMode,
        recommendationProfileId: src.recommendationProfileId,
        seed: src.seed,
        settings: src.settings ?? undefined,
        days: {
          create: src.days.map((d) => ({
            dayIndex: d.dayIndex,
            meals: {
              create: d.meals.map((m) => ({
                role: m.role,
                locked: m.locked,
                sequence: m.sequence,
                ingredients: {
                  create: m.ingredients.map((i) => ({
                    foodId: i.foodId,
                    grams: i.grams,
                    fromPantry: i.fromPantry,
                    locked: i.locked,
                    sequence: i.sequence,
                  })),
                },
              })),
            },
          })),
        },
      },
    });
    if (rev) {
      await tx.planRevision.create({
        data: {
          mealPlanId: plan.id,
          revisionNumber: 1,
          reason: `duplicated from ${src.id}`,
          snapshotJson: rev.snapshotJson ?? {},
          createdByUserId: ownerId,
          nutrientSnapshots: {
            create: rev.nutrientSnapshots.map((snap) => ({
              scope: snap.scope,
              dayIndex: snap.dayIndex,
              nutrientKey: snap.nutrientKey,
              mode: snap.mode,
              minAmount: snap.minAmount,
              targetAmount: snap.targetAmount,
              maxAmount: snap.maxAmount,
              consumedAmount: snap.consumedAmount,
              unit: snap.unit,
              percentOfTarget: snap.percentOfTarget,
              status: snap.status,
              confidence: snap.confidence,
            })),
          },
        },
      });
    }
    return plan;
  });
  return copy.id;
}
