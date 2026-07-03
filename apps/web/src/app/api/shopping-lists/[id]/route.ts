import { prisma } from "@goodfood/db";
import { z } from "zod";
import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { assertOwnsShoppingList } from "@/server/plans/ownership";

export const dynamic = "force-dynamic";

const renameSchema = z.object({ name: z.string().trim().min(1).max(120) });

/** PATCH /api/shopping-lists/:id { name } — rename the caller's own list. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    await assertOwnsShoppingList(prisma, actor.userId, id);
    const { name } = renameSchema.parse(await req.json().catch(() => ({})));
    const list = await prisma.savedShoppingList.update({ where: { id }, data: { name } });
    return Response.json({ id: list.id, name: list.name });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/shopping-lists/:id — delete the caller's own list. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    await assertOwnsShoppingList(prisma, actor.userId, id);
    await prisma.savedShoppingList.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
