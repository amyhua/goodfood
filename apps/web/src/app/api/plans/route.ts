import { prisma } from "@goodfood/db";
import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";

export const dynamic = "force-dynamic";

/** GET /api/plans — the caller's own plans, newest first. */
export async function GET(): Promise<Response> {
  try {
    const actor = await resolveActor();
    const plans = await prisma.mealPlan.findMany({
      where: { userId: actor.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        durationDays: true,
        updatedAt: true,
      },
    });
    return Response.json({ authenticated: actor.isAuthenticated, plans });
  } catch (err) {
    return errorResponse(err);
  }
}
