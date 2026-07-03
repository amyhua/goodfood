import { errorResponse } from "@/server/auth/http";
import { getCurrentUser } from "@/server/auth/service";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — the current user, or null when signed out. */
export async function GET(): Promise<Response> {
  try {
    const user = await getCurrentUser();
    return Response.json({ user });
  } catch (err) {
    return errorResponse(err);
  }
}
