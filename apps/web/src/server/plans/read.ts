import "server-only";
import type { PrismaClient } from "@goodfood/db";

export async function getPlan(prisma: PrismaClient, planId: string) {
  const plan = await prisma.mealPlan.findUnique({
    where: { id: planId },
    include: {
      days: {
        orderBy: { dayIndex: "asc" },
        include: {
          meals: {
            orderBy: { sequence: "asc" },
            include: { ingredients: { orderBy: { sequence: "asc" }, include: { food: true } } },
          },
        },
      },
      revisions: {
        orderBy: { revisionNumber: "desc" },
        take: 1,
        include: { nutrientSnapshots: true },
      },
    },
  });
  return plan;
}

function num(v: unknown): number | null {
  return v == null ? null : Number(v);
}

export function serializePlan(plan: NonNullable<Awaited<ReturnType<typeof getPlan>>>) {
  const latest = plan.revisions[0];
  return {
    id: plan.id,
    name: plan.name,
    status: plan.status,
    durationDays: plan.durationDays,
    pantryMode: plan.pantryMode,
    seed: Number(plan.seed),
    days: plan.days.map((d) => ({
      dayIndex: d.dayIndex,
      meals: d.meals.map((m) => ({
        role: m.role,
        locked: m.locked,
        items: m.ingredients.map((i) => ({
          foodId: i.foodId,
          foodName: i.food.name,
          grams: num(i.grams),
          fromPantry: i.fromPantry,
          locked: i.locked,
          source: { fdcId: i.food.fdcId, dataset: i.food.sourceDataset },
        })),
      })),
    })),
    proof: (latest?.nutrientSnapshots ?? []).map((s) => ({
      nutrientKey: s.nutrientKey,
      mode: s.mode,
      unit: s.unit,
      min: num(s.minAmount),
      target: num(s.targetAmount),
      max: num(s.maxAmount),
      consumed: num(s.consumedAmount),
      percentOfTarget: num(s.percentOfTarget),
      status: s.status,
      confidence: s.confidence,
      dayIndex: s.dayIndex,
    })),
    revisionNumber: latest?.revisionNumber ?? null,
  };
}
