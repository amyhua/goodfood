import { prisma } from "@goodfood/db";
import { z } from "zod";
import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { assertOwnsPlan } from "@/server/plans/ownership";

export const dynamic = "force-dynamic";

const saveSchema = z.object({ name: z.string().trim().min(1).max(120).optional() });

/** POST /api/plans/:id/save { name? } — mark the caller's plan SAVED, optionally naming it. */
export async function POST(req: Request, ctx: { params: Promise<{ planId: string }> }): Promise<Response> {
  try {
    const { planId } = await ctx.params;
    const actor = await resolveActor();
    await assertOwnsPlan(prisma, actor.userId, planId);
    const { name } = saveSchema.parse(await req.json().catch(() => ({})));
    const plan = await prisma.mealPlan.update({
      where: { id: planId },
      data: { status: "SAVED", ...(name ? { name } : {}) },
    });
    return Response.json({ id: plan.id, name: plan.name, status: plan.status });
  } catch (err) {
    return errorResponse(err);
  }
}
