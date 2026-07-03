import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { reportPost } from "@/server/board/service";

export const dynamic = "force-dynamic";

/** POST /api/board/:id/report { reason } — flag a post for moderation (rate-limited). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    return Response.json(await reportPost(actor.userId, id, await req.json().catch(() => ({}))));
  } catch (err) {
    return errorResponse(err);
  }
}
