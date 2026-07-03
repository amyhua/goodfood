import { z } from "zod";
import { prisma } from "@goodfood/db";
import { importFdcFood } from "@goodfood/usda";
import { usdaClient } from "@/lib/usda";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ fdcId: z.number().int().positive() });

/** POST /api/foods/import { fdcId } — idempotent import of an FDC food. */
export async function POST(req: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "fdcId (positive integer) is required" }, { status: 400 });
  }
  try {
    const result = await importFdcFood(
      prisma,
      usdaClient(),
      parsed.data.fdcId,
      new Date().toISOString(),
    );
    return Response.json(
      { foodId: result.foodId, fdcId: result.fdcId, created: result.created, name: result.normalized.name },
      { status: result.created ? 201 : 200 },
    );
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
