import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { DIET_PRESETS, listFeed, publishPost } from "@/server/board/service";

export const dynamic = "force-dynamic";

/** GET /api/board?diet=VEGAN — the public feed (only live posts), newest first. */
export async function GET(req: Request): Promise<Response> {
  try {
    const actor = await resolveActor();
    const raw = new URL(req.url).searchParams.get("diet");
    const diet = DIET_PRESETS.includes(raw as (typeof DIET_PRESETS)[number])
      ? (raw as (typeof DIET_PRESETS)[number])
      : undefined;
    const feed = await listFeed({ diet, viewerId: actor.userId });
    return Response.json({ posts: feed });
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/board { mealPlanId, title, description, dietTags[] } — publish a plan (opt-in). */
export async function POST(req: Request): Promise<Response> {
  try {
    const actor = await resolveActor();
    const post = await publishPost(actor.userId, await req.json().catch(() => ({})));
    return Response.json({ id: post.id }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
