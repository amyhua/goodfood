import { z } from "zod";
import { requireAdmin } from "@/server/auth/admin";
import { errorResponse } from "@/server/auth/http";
import { getMonetizationConfig, saveMonetizationOverride } from "@/server/monetization/service";

export const dynamic = "force-dynamic";

/** GET /api/admin/settings — the effective monetization config (admin only). */
export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
    return Response.json({ config: await getMonetizationConfig() });
  } catch (err) {
    return errorResponse(err);
  }
}

const overrideSchema = z.object({
  enabled: z.boolean().optional(),
  freeMonthlyPlanLimit: z.number().int().min(0).optional(),
  freeMonthlyListLimit: z.number().int().min(0).optional(),
  priceMonthlyUsd: z.number().min(0).optional(),
  adsEnabled: z.boolean().optional(),
});

/** PUT /api/admin/settings — flip monetization at runtime (admin only). */
export async function PUT(req: Request): Promise<Response> {
  try {
    await requireAdmin();
    const override = overrideSchema.parse(await req.json().catch(() => ({})));
    await saveMonetizationOverride(override);
    return Response.json({ config: await getMonetizationConfig() });
  } catch (err) {
    return errorResponse(err);
  }
}
