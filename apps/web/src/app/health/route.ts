export const dynamic = "force-dynamic";

/** Liveness probe. Returns 200 with service metadata; no DB/secret access. */
export function GET(): Response {
  return Response.json({
    status: "ok",
    service: "web",
    version: process.env.npm_package_version ?? "0.0.0",
    timestamp: new Date().toISOString(),
  });
}
