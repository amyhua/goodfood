import { errorResponse } from "@/server/auth/http";
import { login } from "@/server/auth/service";

export const dynamic = "force-dynamic";

/** POST /api/auth/login { email, password } — verify + start a session. */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const user = await login(body);
    return Response.json({ user }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
