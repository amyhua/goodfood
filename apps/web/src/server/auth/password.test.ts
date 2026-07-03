import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", stored)).toBe(true);
    expect(verifyPassword("wrong password", stored)).toBe(false);
  });

  it("salts — same password hashes to different strings", () => {
    expect(hashPassword("hunter2")).not.toBe(hashPassword("hunter2"));
  });

  it("encodes the scrypt scheme and parameters", () => {
    expect(hashPassword("abc").startsWith("scrypt$16384$8$1$")).toBe(true);
  });

  it("rejects malformed stored hashes without throwing", () => {
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "notscrypt$1$2$3")).toBe(false);
    expect(verifyPassword("x", "bcrypt$a$b$c$d")).toBe(false);
  });
});
