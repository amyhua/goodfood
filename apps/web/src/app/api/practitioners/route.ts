import { errorResponse } from "@/server/auth/http";
import { listVerifiedPractitioners } from "@/server/practitioners/service";

export const dynamic = "force-dynamic";

/** GET /api/practitioners — verified practitioners + their adoptable plan counts. */
export async function GET(): Promise<Response> {
  try {
    return Response.json({ practitioners: await listVerifiedPractitioners() });
  } catch (err) {
    return errorResponse(err);
  }
}
