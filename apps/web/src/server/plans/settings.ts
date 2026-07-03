import { NUTRIENT_KEYS } from "@goodfood/domain";
import { z } from "zod";

const nutrientKey = z.enum(NUTRIENT_KEYS as unknown as [string, ...string[]]);
const mealRole = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);

export const goalOverrideSchema = z.object({
  key: nutrientKey,
  mode: z.enum(["DISABLED", "MINIMUM", "TARGET", "MAXIMUM"]),
  min: z.number().nonnegative().nullable().optional(),
  target: z.number().nonnegative().nullable().optional(),
  max: z.number().nonnegative().nullable().optional(),
});

export const generateSettingsSchema = z.object({
  userId: z.string().min(1).default("seed-demo-user"),
  name: z.string().min(1).max(120).default("Day plan"),
  durationDays: z.number().int().min(1).max(28).default(1),
  pantryMode: z.enum(["PANTRY_ONLY", "PREFER_PANTRY", "PANTRY_PLUS_SHOPPING"]).default("PANTRY_PLUS_SHOPPING"),
  recommendationProfileId: z.string().optional(),
  mealRoles: z.array(mealRole).min(1).default(["BREAKFAST", "LUNCH", "DINNER"]),
  seed: z.number().int().nonnegative().default(0),
  maxCandidates: z.number().int().min(3).max(200).default(40),
  goalOverrides: z.array(goalOverrideSchema).default([]),
});

export type GenerateSettings = z.infer<typeof generateSettingsSchema>;
export type GoalOverride = z.infer<typeof goalOverrideSchema>;
