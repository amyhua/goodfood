import { prisma } from "@goodfood/db";
import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { assertOwnsPlan } from "@/server/plans/ownership";
import { getPlan } from "@/server/plans/read";

export const dynamic = "force-dynamic";

/** POST /api/plans/:id/duplicate — clone the caller's plan + its latest immutable revision. */
export async function POST(_req: Request, ctx: { params: Promise<{ planId: string }> }): Promise<Response> {
  const { planId } = await ctx.params;
  let actorId: string;
  try {
    const actor = await resolveActor();
    actorId = actor.userId;
    await assertOwnsPlan(prisma, actorId, planId);
  } catch (err) {
    return errorResponse(err);
  }
  const src = await getPlan(prisma, planId);
  if (!src) return Response.json({ error: "plan not found" }, { status: 404 });
  const rev = src.revisions[0];

  const copy = await prisma.$transaction(async (tx) => {
    const plan = await tx.mealPlan.create({
      data: {
        userId: src.userId,
        name: `Copy of ${src.name}`,
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
          createdByUserId: src.userId,
          nutrientSnapshots: {
            create: rev.nutrientSnapshots.map((s) => ({
              scope: s.scope,
              dayIndex: s.dayIndex,
              nutrientKey: s.nutrientKey,
              mode: s.mode,
              minAmount: s.minAmount,
              targetAmount: s.targetAmount,
              maxAmount: s.maxAmount,
              consumedAmount: s.consumedAmount,
              unit: s.unit,
              percentOfTarget: s.percentOfTarget,
              status: s.status,
              confidence: s.confidence,
            })),
          },
        },
      });
    }
    return plan;
  });
  return Response.json({ id: copy.id, name: copy.name, status: copy.status }, { status: 201 });
}
