import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { signToken, verifyToken } from "./jwt.js";

describe("jwt", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-for-unit-tests-only-32chars";
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("signs and verifies a session payload", () => {
    const token = signToken({ userId: 1, role: "attorney", isPro: false });
    const session = verifyToken(token);
    expect(session.userId).toBe(1);
    expect(session.role).toBe("attorney");
  });
});
