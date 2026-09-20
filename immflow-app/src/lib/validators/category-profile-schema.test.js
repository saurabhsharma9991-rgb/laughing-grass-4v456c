import { describe, expect, it } from "vitest";
import {
  normalizeProfileSchema,
  validateProfileData,
} from "./category-profile-schema";

describe("category profile schema", () => {
  it("normalizes legacy string fields for admin-created categories", () => {
    expect(
      normalizeProfileSchema({ fields: ["licenseNumber"] }).fields[0]
    ).toMatchObject({
      key: "licenseNumber",
      label: "License Number",
      type: "text",
    });
  });

  it("validates required and typed fields", () => {
    const schema = {
      fields: [
        { key: "license", label: "License", required: true },
        { key: "years", label: "Years", type: "number" },
      ],
    };
    expect(() => validateProfileData(schema, { years: 2 })).toThrow(
      "License is required"
    );
    expect(
      validateProfileData(schema, { license: "ABC", years: "4" })
    ).toEqual({ license: "ABC", years: 4 });
  });

  it("rejects duplicate and malformed schema keys", () => {
    expect(() =>
      normalizeProfileSchema({ fields: ["same", "same"] })
    ).toThrow();
  });
});
