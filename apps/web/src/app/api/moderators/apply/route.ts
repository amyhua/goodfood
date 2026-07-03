import { errorResponse } from "@/server/auth/http";
import { AuthError, getCurrentUser } from "@/server/auth/service";
import { applyModerator } from "@/server/moderation/service";

export const dynamic = "force-dynamic";

/** POST /api/moderators/apply { motivation, experience, availability } — apply to moderate. */
export async function POST(req: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AuthError("Sign in required", 401);
    const app = await applyModerator(user.id, await req.json().catch(() => ({})));
    return Response.json({ status: app.status }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
