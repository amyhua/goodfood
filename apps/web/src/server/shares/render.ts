import "server-only";
import { prisma } from "@goodfood/db";
import {
  listHighlights,
  planHighlights,
  serializedToPlanView,
  type PlanView,
  type ShoppingItem,
} from "@/lib/plan-view";
import { getPlan, serializePlan } from "@/server/plans/read";
import { resolveShareBySlug } from "./service";

/** Read model for a public share page + its OG image. Null when the slug is missing/revoked
 *  or the underlying item is gone. */
export interface ShareRender {
  kind: "PLAN" | "LIST";
  title: string;
  summary: string;
  plan?: PlanView;
  items?: ShoppingItem[];
}

export async function loadShareRender(slug: string): Promise<ShareRender | null> {
  const share = await resolveShareBySlug(slug);
  if (!share) return null;

  if (share.kind === "PLAN" && share.mealPlanId) {
    const raw = await getPlan(prisma, share.mealPlanId);
    if (!raw) return null;
    const plan = serializedToPlanView(serializePlan(raw));
    return { kind: "PLAN", title: plan.name, summary: planHighlights(plan).summary, plan };
  }

  if (share.kind === "LIST" && share.savedShoppingList) {
    const items = (share.savedShoppingList.items as unknown as ShoppingItem[]) ?? [];
    return {
      kind: "LIST",
      title: share.savedShoppingList.name,
      summary: listHighlights(items).summary,
      items,
    };
  }

  return null;
}
