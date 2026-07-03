/**
 * Import the curated staple catalog into the DB (Prompt 3). LOCAL/DEV ONLY —
 * makes live USDA calls; never run in CI. Resolves each term to its best
 * Foundation / SR Legacy match and imports idempotently.
 *
 *   USDA_FDC_API_KEY=... pnpm --filter @goodfood/usda import:curated
 */
import { PrismaClient } from "@goodfood/db";
import { CURATED_FOODS, createUsdaClient, importFdcFood } from "../index";

async function main(): Promise<void> {
  const apiKey = process.env.USDA_FDC_API_KEY ?? process.env.FDC_API_KEY;
  if (!apiKey) throw new Error("USDA_FDC_API_KEY (or FDC_API_KEY) is required");
  const only = process.argv[2] ? Number(process.argv[2]) : CURATED_FOODS.length;
  const terms = CURATED_FOODS.slice(0, only);

  const client = createUsdaClient({ apiKey });
  const prisma = new PrismaClient();
  const importedAt = new Date().toISOString();
  let ok = 0;
  let miss = 0;

  try {
    for (const term of terms) {
      try {
        const res = await client.search(term, { dataTypes: ["Foundation", "SR Legacy"], pageSize: 1 });
        const hit = res.foods[0];
        if (!hit) {
          console.warn(`  no match: ${term}`);
          miss++;
          continue;
        }
        const r = await importFdcFood(prisma, client, hit.fdcId, importedAt);
        ok++;
        console.log(`  ${r.created ? "+" : "="} ${term} -> ${hit.fdcId} ${r.normalized.name}`);
      } catch (e) {
        miss++;
        console.warn(`  error: ${term}: ${(e as Error).message}`);
      }
    }
    const total = await prisma.food.count({ where: { source: { in: ["USDA_FOUNDATION", "USDA_SR_LEGACY"] } } });
    console.log(`\nImported ${ok}, missed ${miss}. USDA-backed foods in catalog: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
