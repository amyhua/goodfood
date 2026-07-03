import { prisma } from "@goodfood/db";
import { z } from "zod";
import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { assertOwnsPlan } from "@/server/plans/ownership";

export const dynamic = "force-dynamic";

const shoppingItemSchema = z.object({
  foodName: z.string().min(1),
  grams: z.number().nonnegative().nullable(),
  category: z.string().min(1),
  source: z
    .object({ fdcId: z.number().nullable().optional(), dataset: z.string().nullable().optional() })
    .default({}),
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  mealPlanId: z.string().min(1).optional(),
  items: z.array(shoppingItemSchema).max(500).default([]),
});

/** GET /api/shopping-lists — the caller's saved lists, newest first. */
export async function GET(): Promise<Response> {
  try {
    const actor = await resolveActor();
    const lists = await prisma.savedShoppingList.findMany({
      where: { userId: actor.userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, mealPlanId: true, items: true, updatedAt: true },
    });
    return Response.json({ authenticated: actor.isAuthenticated, lists });
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/shopping-lists { name, mealPlanId?, items } — save a named list for the caller. */
export async function POST(req: Request): Promise<Response> {
  try {
    const actor = await resolveActor();
    const input = createSchema.parse(await req.json().catch(() => ({})));
    if (input.mealPlanId) await assertOwnsPlan(prisma, actor.userId, input.mealPlanId);
    const list = await prisma.savedShoppingList.create({
      data: {
        userId: actor.userId,
        mealPlanId: input.mealPlanId ?? null,
        name: input.name,
        items: input.items,
      },
      select: { id: true, name: true, mealPlanId: true, updatedAt: true },
    });
    return Response.json({ list }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
