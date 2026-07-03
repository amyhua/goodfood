import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { toggleSave } from "@/server/board/service";

export const dynamic = "force-dynamic";

/** POST /api/board/:id/save — toggle the caller's save. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    return Response.json(await toggleSave(actor.userId, id));
  } catch (err) {
    return errorResponse(err);
  }
}
