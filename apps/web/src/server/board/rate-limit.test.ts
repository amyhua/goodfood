import { describe, expect, it } from "vitest";
import { assertUnderLimit, BOARD_LIMITS } from "./rate-limit";

describe("board rate limit", () => {
  it("allows below the max and blocks at/over it", () => {
    expect(() => assertUnderLimit(0, 10, "posts")).not.toThrow();
    expect(() => assertUnderLimit(9, 10, "posts")).not.toThrow();
    expect(() => assertUnderLimit(10, 10, "posts")).toThrowError(/Rate limit/);
    expect(() => assertUnderLimit(11, 10, "posts")).toThrowError(/Rate limit/);
  });

  it("thrown error carries HTTP 429", () => {
    try {
      assertUnderLimit(BOARD_LIMITS.postsPerHour, BOARD_LIMITS.postsPerHour, "posts");
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as { status?: number }).status).toBe(429);
    }
  });
});
