/**
 * Normalize an FDC food detail into our per-100g catalog shape (Prompt 3).
 * For each catalog nutrient, sum the amounts of FDC entries whose nutrient.id is
 * in the catalog `fdc` list (handles EPA+DHA = 1278+1272), converting FDC units to
 * canonical units. Absent nutrients become MISSING (null), never zero (invariant 4).
 * Aliases (folate DFE, vitamin A RAE, vitamin E α-tocopherol, D, choline, ALA, EPA,
 * DHA) are ingested from the already-converted FDC ids — we never derive them.
 */
import { NUTRIENT_CATALOG } from "@goodfood/domain";
import { convert } from "./units";
import type { FdcFoodDetail, NormalizedFood, NormalizedNutrient, NormalizedPortion } from "./types";

function datasetToSource(dataType: string): NormalizedFood["source"] {
  const d = dataType.toLowerCase();
  if (d.includes("foundation")) return "USDA_FOUNDATION";
  if (d.includes("branded")) return "USDA_BRANDED";
  return "USDA_SR_LEGACY";
}

function categoryLabel(cat: FdcFoodDetail["foodCategory"]): string | null {
  if (!cat) return null;
  return typeof cat === "string" ? cat : (cat.description ?? null);
}

export function normalizeFood(food: FdcFoodDetail, importedAt: string): NormalizedFood {
  // Index FDC nutrients by id → list of {amount, unit}.
  const byId = new Map<number, { amount: number; unit: string }[]>();
  for (const fn of food.foodNutrients) {
    if (fn.amount === null || fn.amount === undefined) continue;
    const list = byId.get(fn.nutrient.id) ?? [];
    list.push({ amount: fn.amount, unit: fn.nutrient.unitName });
    byId.set(fn.nutrient.id, list);
  }

  const nutrients: NormalizedNutrient[] = NUTRIENT_CATALOG.map((def) => {
    const present = def.fdc.filter((id) => byId.has(id));
    if (present.length === 0) {
      return {
        nutrientKey: def.key,
        amountPer100g: null,
        unit: def.unit,
        dataQuality: "MISSING",
        nutrientSourceId: null,
      };
    }
    let sum = 0;
    let convertible = true;
    for (const id of present) {
      for (const { amount, unit } of byId.get(id)!) {
        const converted = convert(amount, unit, def.unit);
        if (converted === null) {
          convertible = false;
          break;
        }
        sum += converted;
      }
    }
    // A required source id in the catalog list is absent (partial capture).
    const partial = present.length < def.fdc.length;
    return {
      nutrientKey: def.key,
      amountPer100g: convertible ? sum : null,
      unit: def.unit,
      dataQuality: !convertible ? "MISSING" : partial ? "PARTIAL" : "KNOWN",
      nutrientSourceId: present.join(","),
    };
  });

  const portions: NormalizedPortion[] = (food.foodPortions ?? [])
    .filter((p) => (p.gramWeight ?? 0) > 0)
    .map((p) => ({
      description:
        p.portionDescription?.trim() ||
        [p.amount, p.modifier].filter(Boolean).join(" ").trim() ||
        `${p.gramWeight} g`,
      gramWeight: p.gramWeight as number,
      amount: p.amount ?? null,
      modifier: p.modifier ?? null,
    }));

  return {
    source: datasetToSource(food.dataType),
    fdcId: food.fdcId,
    name: food.description,
    scientificName: food.scientificName ?? null,
    foodCategory: categoryLabel(food.foodCategory),
    dataset: food.dataType,
    nutrients,
    portions,
    importedAt,
    raw: { fdcId: food.fdcId, dataType: food.dataType, publicationDate: food.publicationDate },
  };
}
