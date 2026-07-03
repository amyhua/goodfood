/**
 * Seed (Prompt 2, GOO-17) — idempotent via fixed ids + upserts.
 * Seeds: the 21-nutrient catalog, a default "Adult general nutrition" recommendation
 * profile with goals, a demo user (LOCAL DEV ONLY), and a small SYNTHETIC food catalog
 * clearly separated from USDA-backed foods (invariant 2). Explicit MISSING nutrient rows
 * demonstrate "missing != zero" (invariant 4).
 */
import {
  DEFAULT_ADULT_GOALS,
  NUTRIENT_CATALOG,
  SYNTHETIC_FOODS,
  type NutrientKey,
} from "@goodfood/domain";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PROFILE_ID = "seed-default-adult-profile";
const DEMO_USER_ID = "seed-demo-user";

async function seedNutrients(): Promise<void> {
  for (const n of NUTRIENT_CATALOG) {
    await prisma.nutrientDefinition.upsert({
      where: { key: n.key },
      create: {
        key: n.key,
        displayName: n.displayName,
        unit: n.unit,
        category: n.category,
        sortOrder: n.sortOrder,
        hasDailyValue: n.hasDailyValue,
        defaultUpperLimit: n.defaultUpperLimit ?? null,
        sourceRefs: { fdc: n.fdc },
      },
      update: {
        displayName: n.displayName,
        unit: n.unit,
        category: n.category,
        sortOrder: n.sortOrder,
        hasDailyValue: n.hasDailyValue,
        defaultUpperLimit: n.defaultUpperLimit ?? null,
        sourceRefs: { fdc: n.fdc },
      },
    });
  }
}

async function seedDefaultProfile(): Promise<void> {
  await prisma.recommendationProfile.upsert({
    where: { id: DEFAULT_PROFILE_ID },
    create: {
      id: DEFAULT_PROFILE_ID,
      name: "Adult general nutrition",
      description: "General-adult daily targets derived from FDA DV / NIH DRI values.",
      isDefault: true,
    },
    update: { name: "Adult general nutrition", isDefault: true },
  });

  for (const g of DEFAULT_ADULT_GOALS) {
    await prisma.recommendationGoal.upsert({
      where: {
        recommendationProfileId_nutrientKey: {
          recommendationProfileId: DEFAULT_PROFILE_ID,
          nutrientKey: g.nutrientKey,
        },
      },
      create: {
        recommendationProfileId: DEFAULT_PROFILE_ID,
        nutrientKey: g.nutrientKey,
        mode: g.mode,
        minAmount: g.min ?? null,
        targetAmount: g.target ?? null,
        maxAmount: g.max ?? null,
        toleranceLowPct: g.toleranceLowPct ?? null,
        toleranceHighPct: g.toleranceHighPct ?? null,
      },
      update: {
        mode: g.mode,
        minAmount: g.min ?? null,
        targetAmount: g.target ?? null,
        maxAmount: g.max ?? null,
        toleranceLowPct: g.toleranceLowPct ?? null,
        toleranceHighPct: g.toleranceHighPct ?? null,
      },
    });
  }
}

async function seedDemoUser(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    create: {
      id: DEMO_USER_ID,
      email: "demo@goodfood.local",
      name: "Demo User",
      isDemo: true,
      profile: {
        create: {
          displayName: "Demo User",
          age: 30,
          sex: "female",
          activityLevel: "moderate",
        },
      },
    },
    update: { name: "Demo User", isDemo: true },
  });
}

async function seedSyntheticFoods(): Promise<void> {
  const unitFor = new Map(NUTRIENT_CATALOG.map((n) => [n.key, n.unit]));

  for (const f of SYNTHETIC_FOODS) {
    const foodId = `seed-${f.slug}`;
    await prisma.food.upsert({
      where: { id: foodId },
      create: {
        id: foodId,
        source: "SYNTHETIC",
        name: f.name,
        foodCategory: f.foodCategory,
        isSynthetic: true,
        overallDataQuality: "ESTIMATED",
        tags: { create: f.tags.map((tag) => ({ tag })) },
        portions: { create: [{ description: "1 serving (100 g)", gramWeight: 100, sequence: 0 }] },
      },
      update: { name: f.name, foodCategory: f.foodCategory, isSynthetic: true },
    });

    // Present nutrients.
    for (const [key, amount] of Object.entries(f.per100g) as [NutrientKey, number][]) {
      await prisma.foodNutrient.upsert({
        where: { foodId_nutrientKey: { foodId, nutrientKey: key } },
        create: {
          foodId,
          nutrientKey: key,
          amountPer100g: amount,
          unit: unitFor.get(key) ?? "",
          dataQuality: "ESTIMATED",
          sourceDataset: "synthetic",
        },
        update: { amountPer100g: amount, dataQuality: "ESTIMATED" },
      });
    }

    // Explicit MISSING rows on salmon for iodine + choline (missing != zero).
    if (f.slug === "synthetic-salmon") {
      for (const key of ["iodine", "choline"] as NutrientKey[]) {
        await prisma.foodNutrient.upsert({
          where: { foodId_nutrientKey: { foodId, nutrientKey: key } },
          create: {
            foodId,
            nutrientKey: key,
            amountPer100g: null,
            unit: unitFor.get(key) ?? "",
            dataQuality: "MISSING",
            sourceDataset: "synthetic",
          },
          update: { amountPer100g: null, dataQuality: "MISSING" },
        });
      }
    }
  }
}

async function main(): Promise<void> {
  await seedNutrients();
  await seedDefaultProfile();
  await seedDemoUser();
  await seedSyntheticFoods();
  const counts = {
    nutrients: await prisma.nutrientDefinition.count(),
    goals: await prisma.recommendationGoal.count(),
    users: await prisma.user.count(),
    foods: await prisma.food.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
