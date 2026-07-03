import "server-only";
import { createUsdaClient, type UsdaClient } from "@goodfood/usda";

/** Build a USDA client from server env. Throws if the key is unset (server-only). */
export function usdaClient(): UsdaClient {
  const apiKey = process.env.USDA_FDC_API_KEY ?? process.env.FDC_API_KEY;
  if (!apiKey) throw new Error("USDA_FDC_API_KEY is not configured");
  return createUsdaClient({ apiKey });
}
