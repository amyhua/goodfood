import { errorResponse } from "@/server/auth/http";
import { AuthError, getCurrentUser } from "@/server/auth/service";
import { createDraft, listApproved } from "@/server/moderation/service";

export const dynamic = "force-dynamic";

/** GET /api/content — approved (published) content-team posts. Public. */
export async function GET(): Promise<Response> {
  try {
    return Response.json({ posts: await listApproved() });
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/content { title, body } — create a draft (signed-in). Needs moderation to go live. */
export async function POST(req: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AuthError("Sign in required", 401);
    const post = await createDraft(user.id, await req.json().catch(() => ({})));
    return Response.json({ id: post.id, state: post.state }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
