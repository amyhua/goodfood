import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { toggleLike } from "@/server/board/service";

export const dynamic = "force-dynamic";

/** POST /api/board/:id/like — toggle the caller's like. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    return Response.json(await toggleLike(actor.userId, id));
  } catch (err) {
    return errorResponse(err);
  }
}
