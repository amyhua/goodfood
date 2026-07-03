import "server-only";
import type { PrismaClient } from "@goodfood/db";

/**
 * Safely reassign a user's owned content to another user (F2). Used to migrate the
 * seed demo user's plans/lists/pantry onto a real account on request. Demo data is NOT
 * moved automatically — ownership stays with the demo user until this is called, so a new
 * signup never inherits someone else's data by accident.
 */
export async function reassignUserData(
  prisma: PrismaClient,
  fromUserId: string,
  toUserId: string,
): Promise<{ mealPlans: number; shoppingLists: number; pantryItems: number }> {
  if (fromUserId === toUserId) throw new Error("from and to users must differ");
  const [mealPlans, shoppingLists, pantryItems] = await prisma.$transaction([
    prisma.mealPlan.updateMany({ where: { userId: fromUserId }, data: { userId: toUserId } }),
    prisma.savedShoppingList.updateMany({ where: { userId: fromUserId }, data: { userId: toUserId } }),
    prisma.pantryItem.updateMany({ where: { userId: fromUserId }, data: { userId: toUserId } }),
  ]);
  return {
    mealPlans: mealPlans.count,
    shoppingLists: shoppingLists.count,
    pantryItems: pantryItems.count,
  };
}
