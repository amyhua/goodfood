/**
 * @goodfood/db — Prisma client factory + re-exports.
 * Prompt 1 ships the singleton factory; Prompt 2 adds domain models + seed.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Create (or reuse in dev) a single PrismaClient. Never connects until first query. */
export function createPrismaClient(): PrismaClient {
  return globalForPrisma.prisma ?? new PrismaClient();
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());

export { PrismaClient } from "@prisma/client";
