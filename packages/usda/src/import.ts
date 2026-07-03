/**
 * Idempotent import of an FDC food into the normalized catalog (Prompt 3).
 * Upserts Food (keyed by source+fdcId), FoodNutrient rows (present + explicit
 * MISSING so absence is auditable, never zero), portions, and raw provenance.
 * Re-running with the same fdcId converges to the same rows.
 */
import type { PrismaClient } from "@goodfood/db";
import type { UsdaClient } from "./client";
import { normalizeFood } from "./normalize";
import type { NormalizedFood } from "./types";

export interface ImportResult {
  foodId: string;
  fdcId: number;
  created: boolean;
  normalized: NormalizedFood;
}

export async function importFdcFood(
  prisma: PrismaClient,
  client: UsdaClient,
  fdcId: number,
  importedAtIso: string,
): Promise<ImportResult> {
  const detail = await client.getFood(fdcId);
  const norm = normalizeFood(detail, importedAtIso);
  const importedAt = new Date(importedAtIso);

  const existing = await prisma.food.findUnique({
    where: { source_fdcId: { source: norm.source, fdcId: norm.fdcId } },
    select: { id: true },
  });

  const food = await prisma.food.upsert({
    where: { source_fdcId: { source: norm.source, fdcId: norm.fdcId } },
    create: {
      source: norm.source,
      fdcId: norm.fdcId,
      name: norm.name,
      scientificName: norm.scientificName,
      foodCategory: norm.foodCategory,
      sourceDataset: norm.dataset,
      overallDataQuality: "KNOWN",
      rawSource: norm.raw,
      importedAt,
    },
    update: {
      name: norm.name,
      scientificName: norm.scientificName,
      foodCategory: norm.foodCategory,
      sourceDataset: norm.dataset,
      rawSource: norm.raw,
      importedAt,
    },
  });

  for (const n of norm.nutrients) {
    await prisma.foodNutrient.upsert({
      where: { foodId_nutrientKey: { foodId: food.id, nutrientKey: n.nutrientKey } },
      create: {
        foodId: food.id,
        nutrientKey: n.nutrientKey,
        amountPer100g: n.amountPer100g,
        unit: n.unit,
        dataQuality: n.dataQuality,
        sourceDataset: norm.dataset,
        nutrientSourceId: n.nutrientSourceId,
        importedAt,
      },
      update: {
        amountPer100g: n.amountPer100g,
        unit: n.unit,
        dataQuality: n.dataQuality,
        nutrientSourceId: n.nutrientSourceId,
        importedAt,
      },
    });
  }

  // Portions: replace wholesale for a clean idempotent result.
  await prisma.foodPortion.deleteMany({ where: { foodId: food.id } });
  if (norm.portions.length > 0) {
    await prisma.foodPortion.createMany({
      data: norm.portions.map((p, i) => ({
        foodId: food.id,
        description: p.description,
        gramWeight: p.gramWeight,
        amount: p.amount,
        modifier: p.modifier,
        sequence: i,
      })),
    });
  }

  return { foodId: food.id, fdcId: norm.fdcId, created: existing === null, normalized: norm };
}
