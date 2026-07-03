import { z } from "zod";
import { requireAdmin } from "@/server/auth/admin";
import { errorResponse } from "@/server/auth/http";
import { decideModerator, listModeratorApplications } from "@/server/moderation/service";

export const dynamic = "force-dynamic";

/** GET /api/admin/moderators — pending moderator applications (owner/admin only). */
export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
    return Response.json({ pending: await listModeratorApplications() });
  } catch (err) {
    return errorResponse(err);
  }
}

const decideSchema = z.object({ userId: z.string().min(1), decision: z.enum(["APPROVED", "REJECTED"]) });

/** PUT /api/admin/moderators { userId, decision } — promote/deny (owner/admin only). */
export async function PUT(req: Request): Promise<Response> {
  try {
    await requireAdmin();
    const { userId, decision } = decideSchema.parse(await req.json().catch(() => ({})));
    const app = await decideModerator(userId, decision);
    return Response.json({ status: app.status });
  } catch (err) {
    return errorResponse(err);
  }
}
