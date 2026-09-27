import { describe, expect, it } from "vitest";
import { userCanAccess } from "./feature-access.js";
import { DEFAULT_FEATURE_FLAGS } from "../constants/platform-features.js";

describe("userCanAccess", () => {
  it("allows free-tier features for free users", () => {
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "browse_attorneys", false)).toBe(true);
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "apply_to_listings", false)).toBe(true);
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "post_listings", false)).toBe(true);
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "attorney_network", false)).toBe(true);
  });

  it("blocks Pro-only features for free users", () => {
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "ai_matcher", false)).toBe(false);
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "direct_messaging", false)).toBe(false);
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "unlimited_listings", false)).toBe(false);
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "priority_contact", false)).toBe(false);
  });

  it("allows Pro-only features for Pro users", () => {
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "ai_matcher", true)).toBe(true);
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "direct_messaging", true)).toBe(true);
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "unlimited_listings", true)).toBe(true);
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "priority_contact", true)).toBe(true);
  });

  it("returns false for unknown features", () => {
    expect(userCanAccess(DEFAULT_FEATURE_FLAGS, "not_a_real_feature", false)).toBe(false);
    expect(userCanAccess({}, "ai_matcher", true)).toBe(false);
  });

  it("respects admin overrides that open a feature on Free", () => {
    const flags = {
      ...DEFAULT_FEATURE_FLAGS,
      ai_matcher: { ...DEFAULT_FEATURE_FLAGS.ai_matcher, free: true, pro: true },
    };
    expect(userCanAccess(flags, "ai_matcher", false)).toBe(true);
  });
});
