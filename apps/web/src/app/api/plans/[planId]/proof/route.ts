import { prisma } from "@goodfood/db";
import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { assertOwnsPlan } from "@/server/plans/ownership";
import { getPlan, serializePlan } from "@/server/plans/read";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ planId: string }> }): Promise<Response> {
  try {
    const { planId } = await ctx.params;
    const actor = await resolveActor();
    await assertOwnsPlan(prisma, actor.userId, planId);
    const plan = await getPlan(prisma, planId);
    if (!plan) return Response.json({ error: "plan not found" }, { status: 404 });
    const s = serializePlan(plan);
    return Response.json({ planId: s.id, revisionNumber: s.revisionNumber, proof: s.proof });
  } catch (err) {
    return errorResponse(err);
  }
}
