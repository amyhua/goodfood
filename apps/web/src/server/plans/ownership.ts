import "server-only";
import type { PrismaClient } from "@goodfood/db";
import { AuthError } from "@/server/auth/service";

/**
 * Row-level ownership guards (F2). A user may only touch their own rows. We return 404
 * (not 403) on someone else's row so existence never leaks.
 */
export async function assertOwnsPlan(
  prisma: PrismaClient,
  userId: string,
  planId: string,
): Promise<void> {
  const plan = await prisma.mealPlan.findUnique({ where: { id: planId }, select: { userId: true } });
  if (!plan || plan.userId !== userId) throw new AuthError("Plan not found", 404);
}

export async function assertOwnsShoppingList(
  prisma: PrismaClient,
  userId: string,
  listId: string,
): Promise<void> {
  const list = await prisma.savedShoppingList.findUnique({
    where: { id: listId },
    select: { userId: true },
  });
  if (!list || list.userId !== userId) throw new AuthError("Shopping list not found", 404);
}
