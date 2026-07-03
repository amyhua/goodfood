import { errorResponse } from "@/server/auth/http";
import { AuthError, getCurrentUser } from "@/server/auth/service";
import { submitForReview } from "@/server/moderation/service";

export const dynamic = "force-dynamic";

/** POST /api/content/:id/submit — author submits a draft; runs the safety pre-check. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const user = await getCurrentUser();
    if (!user) throw new AuthError("Sign in required", 401);
    const { post, safety } = await submitForReview(user.id, id);
    return Response.json({ state: post.state, safety });
  } catch (err) {
    return errorResponse(err);
  }
}
