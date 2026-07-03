import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@goodfood/db";
import { z } from "zod";
import { AuthError } from "@/server/auth/service";

/**
 * Sharing service (F3). A share is explicit + revocable and exposes exactly one plan or
 * list via an unguessable slug. Ownership is verified on create/revoke; the public
 * resolver returns null for missing OR revoked slugs so nothing private ever leaks.
 */
export const createShareSchema = z.object({
  kind: z.enum(["PLAN", "LIST"]),
  id: z.string().min(1),
});

/** 22-char URL-safe token (128 bits). */
function genSlug(): string {
  return randomBytes(16).toString("base64url");
}

export async function createShare(userId: string, input: unknown) {
  const { kind, id } = createShareSchema.parse(input);
  if (kind === "PLAN") {
    const plan = await prisma.mealPlan.findUnique({ where: { id }, select: { userId: true } });
    if (!plan || plan.userId !== userId) throw new AuthError("Plan not found", 404);
  } else {
    const list = await prisma.savedShoppingList.findUnique({ where: { id }, select: { userId: true } });
    if (!list || list.userId !== userId) throw new AuthError("Shopping list not found", 404);
  }
  const ref = kind === "PLAN" ? { mealPlanId: id } : { savedShoppingListId: id };
  // Idempotent: reuse the caller's live share for this item instead of piling up rows.
  const existing = await prisma.share.findFirst({ where: { userId, revokedAt: null, ...ref } });
  if (existing) return existing;
  return prisma.share.create({ data: { slug: genSlug(), kind, userId, ...ref } });
}

export async function revokeShare(userId: string, slug: string): Promise<void> {
  const share = await prisma.share.findUnique({ where: { slug }, select: { userId: true, revokedAt: true } });
  if (!share || share.userId !== userId) throw new AuthError("Share not found", 404);
  if (!share.revokedAt) await prisma.share.update({ where: { slug }, data: { revokedAt: new Date() } });
}

/** Public — no auth. Returns a live share (with its item) or null. */
export async function resolveShareBySlug(slug: string) {
  const share = await prisma.share.findUnique({
    where: { slug },
    include: { savedShoppingList: true },
  });
  if (!share || share.revokedAt) return null;
  return share;
}
