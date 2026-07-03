import { errorResponse } from "@/server/auth/http";
import { logout } from "@/server/auth/service";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout — revoke the current session. */
export async function POST(): Promise<Response> {
  try {
    await logout();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
