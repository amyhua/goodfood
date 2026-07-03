import { prisma } from "@goodfood/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ planId: string }> }): Promise<Response> {
  const { planId } = await ctx.params;
  const existing = await prisma.mealPlan.findUnique({ where: { id: planId } });
  if (!existing) return Response.json({ error: "plan not found" }, { status: 404 });
  const plan = await prisma.mealPlan.update({ where: { id: planId }, data: { status: "SAVED" } });
  return Response.json({ id: plan.id, status: plan.status });
}
