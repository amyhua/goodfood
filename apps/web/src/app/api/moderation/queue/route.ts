import { requireModerator } from "@/server/auth/moderator";
import { errorResponse } from "@/server/auth/http";
import { listQueue } from "@/server/moderation/service";

export const dynamic = "force-dynamic";

/** GET /api/moderation/queue — content awaiting review (moderators only; no author PII). */
export async function GET(): Promise<Response> {
  try {
    await requireModerator();
    return Response.json({ queue: await listQueue() });
  } catch (err) {
    return errorResponse(err);
  }
}
