import { prisma } from "@goodfood/db";
import { generateSettingsSchema } from "@/server/plans/settings";
import { ProofMismatchError, generatePlan } from "@/server/plans/generate";
import { resolveActor } from "@/server/auth/actor";
import { solverClient } from "@/lib/solver";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** POST /api/plans/generate — validate -> candidates -> solve -> verify -> persist.
 *  Owner is always the session actor (signed-in user, else demo) — never the client. */
export async function POST(req: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const parsed = generateSettingsSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return Response.json({ error: "invalid settings", issues: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const actor = await resolveActor();
    const out = await generatePlan(prisma, solverClient(), { ...parsed.data, userId: actor.userId });
    return Response.json(out, { status: out.feasible ? 201 : 200 });
  } catch (err) {
    if (err instanceof ProofMismatchError) {
      return Response.json({ error: err.message, mismatches: err.mismatches }, { status: 422 });
    }
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
