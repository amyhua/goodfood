import { errorResponse } from "@/server/auth/http";
import { signUp } from "@/server/auth/service";

export const dynamic = "force-dynamic";

/** POST /api/auth/signup { email, password, name? } — create account + session. */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const user = await signUp(body);
    return Response.json({ user }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
