-- CreateEnum
CREATE TYPE "FoodSource" AS ENUM ('USDA_FOUNDATION', 'USDA_SR_LEGACY', 'USDA_BRANDED', 'SYNTHETIC', 'USER');

-- CreateEnum
CREATE TYPE "DataQuality" AS ENUM ('KNOWN', 'PARTIAL', 'MISSING', 'ESTIMATED', 'USER_ENTERED');

-- CreateEnum
CREATE TYPE "NutrientMode" AS ENUM ('DISABLED', 'MINIMUM', 'TARGET', 'MAXIMUM');

-- CreateEnum
CREATE TYPE "NutrientCategory" AS ENUM ('ENERGY', 'MACRO', 'VITAMIN', 'MINERAL', 'FATTY_ACID', 'OTHER');

-- CreateEnum
CREATE TYPE "PantryMode" AS ENUM ('PANTRY_ONLY', 'PREFER_PANTRY', 'PANTRY_PLUS_SHOPPING');

-- CreateEnum
CREATE TYPE "PantryAvailability" AS ENUM ('UNLIMITED', 'LIMITED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "MealRole" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'SAVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DietaryPreset" AS ENUM ('VEGAN', 'VEGETARIAN', 'PESCATARIAN', 'NONDAIRY', 'PALEO', 'KETO', 'WHOLE_FOODS');

-- CreateEnum
CREATE TYPE "BanReason" AS ENUM ('ALLERGY', 'INTOLERANCE', 'DISLIKE', 'RELIGIOUS', 'OTHER');

-- CreateEnum
CREATE TYPE "SolverMode" AS ENUM ('STRICT', 'DIAGNOSTIC');

-- CreateEnum
CREATE TYPE "SolverStatus" AS ENUM ('OPTIMAL', 'FEASIBLE', 'INFEASIBLE', 'TIME_LIMIT', 'ERROR');

-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('MET', 'UNDER', 'OVER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ProofConfidence" AS ENUM ('COMPLETE', 'PARTIAL', 'MISSING');

-- CreateEnum
CREATE TYPE "SnapshotScope" AS ENUM ('PLAN', 'WEEK', 'DAY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "age" INTEGER,
    "sex" TEXT,
    "weightKg" DECIMAL(6,2),
    "heightCm" DECIMAL(6,2),
    "activityLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutrientDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" "NutrientCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "hasDailyValue" BOOLEAN NOT NULL DEFAULT true,
    "defaultUpperLimit" DECIMAL(14,4),
    "conversionRules" JSONB,
    "sourceRefs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutrientDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationGoal" (
    "id" TEXT NOT NULL,
    "recommendationProfileId" TEXT NOT NULL,
    "nutrientKey" TEXT NOT NULL,
    "mode" "NutrientMode" NOT NULL DEFAULT 'DISABLED',
    "minAmount" DECIMAL(14,4),
    "targetAmount" DECIMAL(14,4),
    "maxAmount" DECIMAL(14,4),
    "toleranceLowPct" DECIMAL(6,3),
    "toleranceHighPct" DECIMAL(6,3),
    "upperLimit" DECIMAL(14,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "source" "FoodSource" NOT NULL,
    "fdcId" INTEGER,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "foodCategory" TEXT,
    "preparationState" TEXT,
    "ediblePortionFactor" DECIMAL(6,4) NOT NULL DEFAULT 1,
    "overallDataQuality" "DataQuality" NOT NULL DEFAULT 'KNOWN',
    "isSynthetic" BOOLEAN NOT NULL DEFAULT false,
    "sourceDataset" TEXT,
    "sourceVersion" TEXT,
    "ownerId" TEXT,
    "rawSource" JSONB,
    "importedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodAlias" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'common',

    CONSTRAINT "FoodAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodNutrient" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "nutrientKey" TEXT NOT NULL,
    "amountPer100g" DECIMAL(14,4),
    "unit" TEXT NOT NULL,
    "dataQuality" "DataQuality" NOT NULL DEFAULT 'KNOWN',
    "sourceDataset" TEXT,
    "nutrientSourceId" TEXT,
    "importedAt" TIMESTAMP(3),

    CONSTRAINT "FoodNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodPortion" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gramWeight" DECIMAL(10,3) NOT NULL,
    "amount" DECIMAL(10,3),
    "modifier" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FoodPortion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodTag" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "FoodTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodImage" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "attribution" TEXT,
    "cropMeta" JSONB,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantityGrams" DECIMAL(12,3),
    "unit" TEXT,
    "availability" "PantryAvailability" NOT NULL DEFAULT 'LIMITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodBan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT,
    "tag" TEXT,
    "matchText" TEXT,
    "reason" "BanReason" NOT NULL DEFAULT 'OTHER',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietaryPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preset" "DietaryPreset" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietaryPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "pantryMode" "PantryMode" NOT NULL DEFAULT 'PANTRY_PLUS_SHOPPING',
    "recommendationProfileId" TEXT,
    "seed" BIGINT NOT NULL DEFAULT 0,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanDay" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "targetOverrides" JSONB,

    CONSTRAINT "PlanDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "planDayId" TEXT NOT NULL,
    "role" "MealRole" NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealIngredient" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "grams" DECIMAL(12,3) NOT NULL,
    "householdMeasure" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "fromPantry" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MealIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanRevision" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "reason" TEXT,
    "snapshotJson" JSONB NOT NULL,
    "solverRunId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanNutrientSnapshot" (
    "id" TEXT NOT NULL,
    "planRevisionId" TEXT NOT NULL,
    "scope" "SnapshotScope" NOT NULL DEFAULT 'DAY',
    "dayIndex" INTEGER,
    "nutrientKey" TEXT NOT NULL,
    "mode" "NutrientMode" NOT NULL,
    "minAmount" DECIMAL(14,4),
    "targetAmount" DECIMAL(14,4),
    "maxAmount" DECIMAL(14,4),
    "consumedAmount" DECIMAL(14,4),
    "unit" TEXT NOT NULL,
    "percentOfTarget" DECIMAL(8,2),
    "status" "ProofStatus" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" "ProofConfidence" NOT NULL DEFAULT 'COMPLETE',

    CONSTRAINT "PlanNutrientSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolverRun" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT,
    "mode" "SolverMode" NOT NULL DEFAULT 'STRICT',
    "status" "SolverStatus" NOT NULL,
    "seed" BIGINT NOT NULL DEFAULT 0,
    "objectiveScore" DECIMAL(16,6),
    "durationMs" INTEGER,
    "request" JSONB NOT NULL,
    "response" JSONB,
    "diagnostics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolverRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isDemo_idx" ON "User"("isDemo");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NutrientDefinition_key_key" ON "NutrientDefinition"("key");

-- CreateIndex
CREATE INDEX "NutrientDefinition_category_sortOrder_idx" ON "NutrientDefinition"("category", "sortOrder");

-- CreateIndex
CREATE INDEX "RecommendationProfile_userId_idx" ON "RecommendationProfile"("userId");

-- CreateIndex
CREATE INDEX "RecommendationProfile_isDefault_idx" ON "RecommendationProfile"("isDefault");

-- CreateIndex
CREATE INDEX "RecommendationGoal_nutrientKey_idx" ON "RecommendationGoal"("nutrientKey");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationGoal_recommendationProfileId_nutrientKey_key" ON "RecommendationGoal"("recommendationProfileId", "nutrientKey");

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food"("name");

-- CreateIndex
CREATE INDEX "Food_isSynthetic_idx" ON "Food"("isSynthetic");

-- CreateIndex
CREATE INDEX "Food_source_idx" ON "Food"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Food_source_fdcId_key" ON "Food"("source", "fdcId");

-- CreateIndex
CREATE INDEX "FoodAlias_alias_idx" ON "FoodAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "FoodAlias_foodId_alias_key" ON "FoodAlias"("foodId", "alias");

-- CreateIndex
CREATE INDEX "FoodNutrient_nutrientKey_idx" ON "FoodNutrient"("nutrientKey");

-- CreateIndex
CREATE UNIQUE INDEX "FoodNutrient_foodId_nutrientKey_key" ON "FoodNutrient"("foodId", "nutrientKey");

-- CreateIndex
CREATE INDEX "FoodPortion_foodId_idx" ON "FoodPortion"("foodId");

-- CreateIndex
CREATE INDEX "FoodTag_tag_idx" ON "FoodTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "FoodTag_foodId_tag_key" ON "FoodTag"("foodId", "tag");

-- CreateIndex
CREATE INDEX "FoodImage_foodId_idx" ON "FoodImage"("foodId");

-- CreateIndex
CREATE INDEX "PantryItem_userId_idx" ON "PantryItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PantryItem_userId_foodId_key" ON "PantryItem"("userId", "foodId");

-- CreateIndex
CREATE INDEX "FoodBan_userId_idx" ON "FoodBan"("userId");

-- CreateIndex
CREATE INDEX "FoodBan_tag_idx" ON "FoodBan"("tag");

-- CreateIndex
CREATE INDEX "DietaryPreference_userId_idx" ON "DietaryPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DietaryPreference_userId_preset_key" ON "DietaryPreference"("userId", "preset");

-- CreateIndex
CREATE INDEX "MealPlan_userId_idx" ON "MealPlan"("userId");

-- CreateIndex
CREATE INDEX "MealPlan_status_idx" ON "MealPlan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PlanDay_mealPlanId_dayIndex_key" ON "PlanDay"("mealPlanId", "dayIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_planDayId_role_key" ON "Meal"("planDayId", "role");

-- CreateIndex
CREATE INDEX "MealIngredient_mealId_idx" ON "MealIngredient"("mealId");

-- CreateIndex
CREATE INDEX "MealIngredient_foodId_idx" ON "MealIngredient"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanRevision_solverRunId_key" ON "PlanRevision"("solverRunId");

-- CreateIndex
CREATE INDEX "PlanRevision_mealPlanId_idx" ON "PlanRevision"("mealPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanRevision_mealPlanId_revisionNumber_key" ON "PlanRevision"("mealPlanId", "revisionNumber");

-- CreateIndex
CREATE INDEX "PlanNutrientSnapshot_planRevisionId_idx" ON "PlanNutrientSnapshot"("planRevisionId");

-- CreateIndex
CREATE INDEX "PlanNutrientSnapshot_nutrientKey_idx" ON "PlanNutrientSnapshot"("nutrientKey");

-- CreateIndex
CREATE UNIQUE INDEX "PlanNutrientSnapshot_planRevisionId_scope_dayIndex_nutrient_key" ON "PlanNutrientSnapshot"("planRevisionId", "scope", "dayIndex", "nutrientKey");

-- CreateIndex
CREATE INDEX "SolverRun_mealPlanId_idx" ON "SolverRun"("mealPlanId");

-- CreateIndex
CREATE INDEX "SolverRun_status_idx" ON "SolverRun"("status");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationProfile" ADD CONSTRAINT "RecommendationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationGoal" ADD CONSTRAINT "RecommendationGoal_recommendationProfileId_fkey" FOREIGN KEY ("recommendationProfileId") REFERENCES "RecommendationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationGoal" ADD CONSTRAINT "RecommendationGoal_nutrientKey_fkey" FOREIGN KEY ("nutrientKey") REFERENCES "NutrientDefinition"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodAlias" ADD CONSTRAINT "FoodAlias_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodNutrient" ADD CONSTRAINT "FoodNutrient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodNutrient" ADD CONSTRAINT "FoodNutrient_nutrientKey_fkey" FOREIGN KEY ("nutrientKey") REFERENCES "NutrientDefinition"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodPortion" ADD CONSTRAINT "FoodPortion_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodTag" ADD CONSTRAINT "FoodTag_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodImage" ADD CONSTRAINT "FoodImage_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodBan" ADD CONSTRAINT "FoodBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodBan" ADD CONSTRAINT "FoodBan_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietaryPreference" ADD CONSTRAINT "DietaryPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_recommendationProfileId_fkey" FOREIGN KEY ("recommendationProfileId") REFERENCES "RecommendationProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDay" ADD CONSTRAINT "PlanDay_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_planDayId_fkey" FOREIGN KEY ("planDayId") REFERENCES "PlanDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealIngredient" ADD CONSTRAINT "MealIngredient_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealIngredient" ADD CONSTRAINT "MealIngredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanRevision" ADD CONSTRAINT "PlanRevision_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanRevision" ADD CONSTRAINT "PlanRevision_solverRunId_fkey" FOREIGN KEY ("solverRunId") REFERENCES "SolverRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanNutrientSnapshot" ADD CONSTRAINT "PlanNutrientSnapshot_planRevisionId_fkey" FOREIGN KEY ("planRevisionId") REFERENCES "PlanRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolverRun" ADD CONSTRAINT "SolverRun_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Invariant CHECK constraints (Prompt 2). Enforced in the DB in addition to
-- Zod validation in @goodfood/domain. NULLs pass (missing != violation).
-- ---------------------------------------------------------------------------
ALTER TABLE "MealIngredient" ADD CONSTRAINT "MealIngredient_grams_positive" CHECK ("grams" > 0);
ALTER TABLE "FoodPortion" ADD CONSTRAINT "FoodPortion_gramWeight_positive" CHECK ("gramWeight" > 0);
ALTER TABLE "Food" ADD CONSTRAINT "Food_ediblePortionFactor_positive" CHECK ("ediblePortionFactor" > 0);
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_quantity_nonnegative" CHECK ("quantityGrams" IS NULL OR "quantityGrams" >= 0);
ALTER TABLE "FoodNutrient" ADD CONSTRAINT "FoodNutrient_amount_nonnegative" CHECK ("amountPer100g" IS NULL OR "amountPer100g" >= 0);
-- min <= target <= max, only across the pairs that are both present.
ALTER TABLE "RecommendationGoal" ADD CONSTRAINT "RecommendationGoal_min_le_max" CHECK ("minAmount" IS NULL OR "maxAmount" IS NULL OR "minAmount" <= "maxAmount");
ALTER TABLE "RecommendationGoal" ADD CONSTRAINT "RecommendationGoal_min_le_target" CHECK ("minAmount" IS NULL OR "targetAmount" IS NULL OR "minAmount" <= "targetAmount");
ALTER TABLE "RecommendationGoal" ADD CONSTRAINT "RecommendationGoal_target_le_max" CHECK ("targetAmount" IS NULL OR "maxAmount" IS NULL OR "targetAmount" <= "maxAmount");
