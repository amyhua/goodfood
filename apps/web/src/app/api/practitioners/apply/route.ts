import { errorResponse } from "@/server/auth/http";
import { AuthError, getCurrentUser } from "@/server/auth/service";
import { applyPractitioner } from "@/server/practitioners/service";

export const dynamic = "force-dynamic";

/** POST /api/practitioners/apply — submit a practitioner application (must be signed in). */
export async function POST(req: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AuthError("Sign in to apply", 401);
    const profile = await applyPractitioner(user.id, await req.json().catch(() => ({})));
    return Response.json({ status: profile.status }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
