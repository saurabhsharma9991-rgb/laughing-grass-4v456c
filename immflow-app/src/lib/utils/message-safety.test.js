import { describe, expect, it } from "vitest";
import { containsPhoneNumber, messageFlagFor } from "./message-safety";

describe("containsPhoneNumber", () => {
  it("detects common phone formats", () => {
    expect(containsPhoneNumber("Call me at (214) 555-0199")).toBe(true);
    expect(containsPhoneNumber("my number +1 214 555 0199")).toBe(true);
    expect(containsPhoneNumber("WhatsApp 9779812345678")).toBe(true);
    expect(containsPhoneNumber("text 214.555.0199 later")).toBe(true);
  });

  it("detects numbers spelled out in words", () => {
    expect(
      containsPhoneNumber("two one four five five five zero one nine nine")
    ).toBe(true);
  });

  it("ignores ordinary short numbers and dates", () => {
    expect(containsPhoneNumber("The hearing is on 2026-10-17")).toBe(false);
    expect(containsPhoneNumber("Order #1234 costs $150")).toBe(false);
    expect(containsPhoneNumber("I need 3 pages translated")).toBe(false);
  });
});

describe("messageFlagFor", () => {
  it("returns a phone flag reason", () => {
    expect(messageFlagFor("reach me on 214-555-0199")).toEqual({
      flagged: true,
      flagReason: "phone_number",
    });
    expect(messageFlagFor("See you Tuesday")).toEqual({
      flagged: false,
      flagReason: null,
    });
  });
});
