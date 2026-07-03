import { describe, expect, it } from "vitest";
import { GET } from "./route";

// Validation happens before any USDA call, so this makes no network request.
describe("GET /api/foods/search", () => {
  it("returns 400 when q is missing", async () => {
    const res = await GET(new Request("http://x/api/foods/search"));
    expect(res.status).toBe(400);
  });
  it("returns 400 when q is blank", async () => {
    const res = await GET(new Request("http://x/api/foods/search?q=%20"));
    expect(res.status).toBe(400);
  });
});
