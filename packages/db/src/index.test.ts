import { describe, expect, it } from "vitest";
import { createPrismaClient } from "./index";

// Offline: we assert the factory contract without opening a DB connection.
describe("db", () => {
  it("exposes a client factory", () => {
    expect(typeof createPrismaClient).toBe("function");
  });
});
