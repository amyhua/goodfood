import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { shareUrl } from "@/lib/app-url";
import { createShare } from "@/server/shares/service";

export const dynamic = "force-dynamic";

/** POST /api/shares { kind: "PLAN"|"LIST", id } — opt a plan/list into public sharing. */
export async function POST(req: Request): Promise<Response> {
  try {
    const actor = await resolveActor();
    const share = await createShare(actor.userId, await req.json().catch(() => ({})));
    return Response.json({ slug: share.slug, url: shareUrl(share.slug) }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
