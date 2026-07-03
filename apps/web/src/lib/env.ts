import "server-only";
import { z } from "zod";

/**
 * Server-only environment validation. These values must NEVER reach the browser
 * (no NEXT_PUBLIC_ prefix). Validated at first access; throws loudly on misconfig.
 */
export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  USDA_FDC_API_KEY: z.string().min(1).optional(),
  SOLVER_URL: z.string().url().default("http://localhost:8000"),
  AUTH_SECRET: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid server environment:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}

let cached: ServerEnv | undefined;
export function serverEnv(): ServerEnv {
  return (cached ??= parseServerEnv());
}
