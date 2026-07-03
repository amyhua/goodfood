import { z } from "zod";
import { AuthError } from "./service";

/** Map thrown auth/validation errors to a JSON Response. Unknown errors → 500. */
export function errorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof z.ZodError) {
    return Response.json({ error: "Invalid input", issues: err.flatten() }, { status: 400 });
  }
  return Response.json({ error: (err as Error).message ?? "Server error" }, { status: 500 });
}
