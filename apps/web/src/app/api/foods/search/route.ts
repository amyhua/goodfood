import { z } from "zod";
import { usdaClient } from "@/lib/usda";

export const dynamic = "force-dynamic";

const querySchema = z.object({ q: z.string().trim().min(1).max(200) });

/** GET /api/foods/search?q= — live USDA search (Foundation + SR Legacy). */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return Response.json({ error: "q is required" }, { status: 400 });
  }
  try {
    const res = await usdaClient().search(parsed.data.q, {
      dataTypes: ["Foundation", "SR Legacy"],
      pageSize: 15,
    });
    const foods = res.foods.map((f) => ({
      fdcId: f.fdcId,
      name: f.description,
      dataType: f.dataType,
      category: f.foodCategory ?? null,
    }));
    return Response.json({ query: parsed.data.q, total: res.totalHits, foods });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
