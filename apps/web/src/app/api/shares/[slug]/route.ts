import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { revokeShare } from "@/server/shares/service";

export const dynamic = "force-dynamic";

/** DELETE /api/shares/:slug — revoke a share the caller owns (public page then 404s). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }): Promise<Response> {
  try {
    const { slug } = await ctx.params;
    const actor = await resolveActor();
    await revokeShare(actor.userId, slug);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
