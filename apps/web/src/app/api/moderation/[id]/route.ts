import { z } from "zod";
import { requireModerator } from "@/server/auth/moderator";
import { errorResponse } from "@/server/auth/http";
import { auditTrail, moderate } from "@/server/moderation/service";

export const dynamic = "force-dynamic";

/** GET /api/moderation/:id — the audit trail for a content post (moderators only). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    await requireModerator();
    const { id } = await ctx.params;
    return Response.json({ events: await auditTrail(id) });
  } catch (err) {
    return errorResponse(err);
  }
}

const decideSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "TAKEDOWN", "FLAG"]),
  note: z.string().trim().max(1000).optional(),
});

/** PUT /api/moderation/:id { decision, note? } — a moderator decision (audited). */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const mod = await requireModerator();
    const { id } = await ctx.params;
    const { decision, note } = decideSchema.parse(await req.json().catch(() => ({})));
    const post = await moderate(mod.id, id, decision, note);
    return Response.json({ state: post.state });
  } catch (err) {
    return errorResponse(err);
  }
}
