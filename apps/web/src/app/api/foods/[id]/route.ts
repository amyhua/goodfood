import { prisma } from "@goodfood/db";

export const dynamic = "force-dynamic";

/** GET /api/foods/:id — normalized food detail with provenance + data quality. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const food = await prisma.food.findUnique({
    where: { id },
    include: {
      nutrients: { orderBy: { nutrientKey: "asc" } },
      portions: { orderBy: { sequence: "asc" } },
      tags: true,
      images: true,
    },
  });
  if (!food) return Response.json({ error: "food not found" }, { status: 404 });

  return Response.json({
    id: food.id,
    source: food.source,
    fdcId: food.fdcId,
    name: food.name,
    scientificName: food.scientificName,
    foodCategory: food.foodCategory,
    dataset: food.sourceDataset,
    dataQuality: food.overallDataQuality,
    isSynthetic: food.isSynthetic,
    importedAt: food.importedAt,
    provenance: food.rawSource,
    // Per-100g nutrients — nulls are MISSING (never zero, invariant 4).
    nutrients: food.nutrients.map((n) => ({
      nutrientKey: n.nutrientKey,
      amountPer100g: n.amountPer100g,
      unit: n.unit,
      dataQuality: n.dataQuality,
      nutrientSourceId: n.nutrientSourceId,
    })),
    portions: food.portions.map((p) => ({
      description: p.description,
      gramWeight: p.gramWeight,
      amount: p.amount,
      modifier: p.modifier,
    })),
    tags: food.tags.map((t) => t.tag),
    images: food.images.map((im) => ({ url: im.url, altText: im.altText, license: im.license, source: im.source })),
  });
}
