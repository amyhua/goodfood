import { resolveActor } from "@/server/auth/actor";
import { errorResponse } from "@/server/auth/http";
import { getMonetizationConfig } from "@/server/monetization/service";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout — Stripe-ready subscription scaffold (F10). Inert without keys:
 * returns { configured: false } when STRIPE_SECRET_KEY is unset (default). When a key IS set,
 * this is where a Stripe Checkout Session would be created (test mode) and its URL returned.
 * No live charging is wired — deliberately, until real keys + a price id are provided.
 */
export async function POST(): Promise<Response> {
  try {
    await resolveActor();
    const config = await getMonetizationConfig();
    const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
    if (!hasStripe) {
      return Response.json({
        configured: false,
        message:
          "Billing is not configured. Set STRIPE_SECRET_KEY + STRIPE_PRICE_ID (test mode) to enable checkout.",
        priceMonthlyUsd: config.priceMonthlyUsd,
      });
    }
    // With keys present, create a Stripe Checkout Session here (test mode) and return session.url.
    return Response.json({
      configured: true,
      message: "Stripe is configured; wire createCheckoutSession() with STRIPE_PRICE_ID to go live.",
      priceMonthlyUsd: config.priceMonthlyUsd,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
