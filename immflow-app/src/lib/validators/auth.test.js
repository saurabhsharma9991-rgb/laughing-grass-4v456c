import { describe, expect, it } from "vitest";
import {
  validateEmail,
  validatePassword,
  validateSignupBody,
} from "./auth.js";

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("not-an-email")).toBeTruthy();
    expect(validateEmail("")).toBeTruthy();
  });
});

describe("validatePassword", () => {
  it("enforces minimum length", () => {
    expect(validatePassword("short")).toBeTruthy();
    expect(validatePassword("longenough")).toBeNull();
  });
});

describe("validateSignupBody", () => {
  it("returns normalized valid payload", () => {
    const result = validateSignupBody({
      email: "attorney@firm.com",
      password: "securepass",
      data: { bar_number: "12345", bar_state: "CA" },
    });
    expect(result.valid).toBe(true);
    expect(result.data.email).toBe("attorney@firm.com");
  });

  it("collects field errors", () => {
    const result = validateSignupBody({ email: "bad", password: "x" });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.password).toBeTruthy();
    expect(result.errors.bar_number).toBeTruthy();
    expect(result.errors.bar_state).toBeTruthy();
  });
});
