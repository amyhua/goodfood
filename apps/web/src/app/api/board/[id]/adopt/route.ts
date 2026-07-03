import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { adoptPost } from "@/server/board/service";

export const dynamic = "force-dynamic";

/** POST /api/board/:id/adopt — duplicate the post's plan into the caller's account. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const planId = await adoptPost(actor.userId, id);
    return Response.json({ planId }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
