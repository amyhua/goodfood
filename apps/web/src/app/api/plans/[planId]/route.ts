import { prisma } from "@goodfood/db";
import { getPlan, serializePlan } from "@/server/plans/read";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ planId: string }> }): Promise<Response> {
  const { planId } = await ctx.params;
  const plan = await getPlan(prisma, planId);
  if (!plan) return Response.json({ error: "plan not found" }, { status: 404 });
  return Response.json(serializePlan(plan));
}
