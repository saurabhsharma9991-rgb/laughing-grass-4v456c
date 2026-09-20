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
  it("returns normalized valid attorney payload", () => {
    const result = validateSignupBody({
      email: "attorney@firm.com",
      password: "securepass",
      accountType: "attorney",
      data: { full_name: "Jane Doe", bar_number: "12345", bar_state: "CA" },
    });
    expect(result.valid).toBe(true);
    expect(result.data.email).toBe("attorney@firm.com");
  });

  it("allows seeker without bar fields", () => {
    const result = validateSignupBody({
      email: "client@example.com",
      password: "securepass",
      accountType: "seeker",
      data: { full_name: "Alex Client" },
    });
    expect(result.valid).toBe(true);
  });

  it("collects field errors for attorney", () => {
    const result = validateSignupBody({
      email: "bad",
      password: "x",
      accountType: "attorney",
      data: {},
    });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.password).toBeTruthy();
    expect(result.errors.full_name).toBeTruthy();
    expect(result.errors.bar_number).toBeTruthy();
    expect(result.errors.bar_state).toBeTruthy();
  });
});
