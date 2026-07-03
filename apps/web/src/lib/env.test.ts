import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

describe("server env validation", () => {
  it("accepts a valid environment and applies SOLVER_URL default", () => {
    const env = parseServerEnv({ DATABASE_URL: "postgresql://u:p@localhost:5432/db" } as never);
    expect(env.SOLVER_URL).toBe("http://localhost:8000");
  });
  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseServerEnv({} as never)).toThrow(/Invalid server environment/);
  });
  it("rejects a non-url DATABASE_URL", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "not-a-url" } as never)).toThrow();
  });
});
