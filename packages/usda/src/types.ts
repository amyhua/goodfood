/** USDA FoodData Central API + normalized types (Prompt 3). */
import type { DataQuality, NutrientKey } from "@goodfood/domain";

// ---- FDC API response shapes (subset we consume) ----

export interface FdcSearchResultFood {
  fdcId: number;
  description: string;
  dataType: string; // "Foundation" | "SR Legacy" | "Branded" | "Survey (FNDDS)"
  foodCategory?: string;
  scientificName?: string;
}

export interface FdcSearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: FdcSearchResultFood[];
}

export interface FdcNutrient {
  nutrient: { id: number; number?: string; name: string; unitName: string };
  amount?: number | null;
}

export interface FdcFoodPortion {
  portionDescription?: string | null;
  modifier?: string | null;
  gramWeight?: number | null;
  amount?: number | null;
}

export interface FdcFoodDetail {
  fdcId: number;
  description: string;
  dataType: string;
  foodClass?: string;
  foodCategory?: string | { description?: string } | null;
  scientificName?: string;
  foodNutrients: FdcNutrient[];
  foodPortions?: FdcFoodPortion[];
  publicationDate?: string;
}

// ---- our normalized shape ----

export interface NormalizedNutrient {
  nutrientKey: NutrientKey;
  amountPer100g: number | null; // null == missing (never zero)
  unit: string; // canonical unit
  dataQuality: DataQuality;
  nutrientSourceId: string | null; // FDC nutrient id(s)
}

export interface NormalizedPortion {
  description: string;
  gramWeight: number;
  amount: number | null;
  modifier: string | null;
}

export interface NormalizedFood {
  source: "USDA_FOUNDATION" | "USDA_SR_LEGACY" | "USDA_BRANDED";
  fdcId: number;
  name: string;
  scientificName: string | null;
  foodCategory: string | null;
  dataset: string; // "Foundation" | "SR Legacy" | ...
  nutrients: NormalizedNutrient[];
  portions: NormalizedPortion[];
  importedAt: string;
  raw: { fdcId: number; dataType: string; publicationDate?: string };
}
