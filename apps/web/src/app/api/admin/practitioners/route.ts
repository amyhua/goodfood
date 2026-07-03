import { z } from "zod";
import { requireAdmin } from "@/server/auth/admin";
import { errorResponse } from "@/server/auth/http";
import { decidePractitioner, listPendingApplications } from "@/server/practitioners/service";

export const dynamic = "force-dynamic";

/** GET /api/admin/practitioners — pending applications (admin only). */
export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
    return Response.json({ pending: await listPendingApplications() });
  } catch (err) {
    return errorResponse(err);
  }
}

const decideSchema = z.object({
  userId: z.string().min(1),
  decision: z.enum(["VERIFIED", "REJECTED"]),
});

/** PUT /api/admin/practitioners { userId, decision } — approve/reject (admin only). */
export async function PUT(req: Request): Promise<Response> {
  try {
    await requireAdmin();
    const { userId, decision } = decideSchema.parse(await req.json().catch(() => ({})));
    const profile = await decidePractitioner(userId, decision);
    return Response.json({ status: profile.status });
  } catch (err) {
    return errorResponse(err);
  }
}
