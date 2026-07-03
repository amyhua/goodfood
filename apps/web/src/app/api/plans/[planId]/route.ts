import { prisma } from "@goodfood/db";
import { z } from "zod";
import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { assertOwnsPlan } from "@/server/plans/ownership";
import { getPlan, serializePlan } from "@/server/plans/read";

export const dynamic = "force-dynamic";

/** GET /api/plans/:id — the caller's own plan (404 for anyone else's). */
export async function GET(_req: Request, ctx: { params: Promise<{ planId: string }> }): Promise<Response> {
  try {
    const { planId } = await ctx.params;
    const actor = await resolveActor();
    await assertOwnsPlan(prisma, actor.userId, planId);
    const plan = await getPlan(prisma, planId);
    if (!plan) return Response.json({ error: "plan not found" }, { status: 404 });
    return Response.json(serializePlan(plan));
  } catch (err) {
    return errorResponse(err);
  }
}

const renameSchema = z.object({ name: z.string().trim().min(1).max(120) });

/** PATCH /api/plans/:id { name } — rename the caller's own plan (custom names, F2). */
export async function PATCH(req: Request, ctx: { params: Promise<{ planId: string }> }): Promise<Response> {
  try {
    const { planId } = await ctx.params;
    const actor = await resolveActor();
    await assertOwnsPlan(prisma, actor.userId, planId);
    const { name } = renameSchema.parse(await req.json().catch(() => ({})));
    const plan = await prisma.mealPlan.update({ where: { id: planId }, data: { name } });
    return Response.json({ id: plan.id, name: plan.name });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/plans/:id — delete the caller's own plan. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ planId: string }> }): Promise<Response> {
  try {
    const { planId } = await ctx.params;
    const actor = await resolveActor();
    await assertOwnsPlan(prisma, actor.userId, planId);
    await prisma.mealPlan.delete({ where: { id: planId } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
