import { describe, expect, it } from "vitest";
import { emailBody, emailSubject } from "./i18n";

const locales = ["en", "es", "hi", "ru", "zh"];
const subjects = [
  "verify",
  "welcome",
  "newApplication",
  "applicationStatus",
  "newMessage",
  "renewal",
  "providerApproved",
  "providerRejected",
  "credentialUpdate",
  "orderUpdate",
  "bookingUpdate",
];
const bodies = [
  "verify",
  "welcome",
  "application",
  "message",
  "renewal",
  "providerApproved",
  "providerRejected",
  "order",
  "booking",
  "credential",
];

describe("localized email copy", () => {
  it("returns string subjects for every supported locale", () => {
    for (const locale of locales) {
      for (const key of subjects) {
        expect(emailSubject(locale, key)).toEqual(expect.any(String));
        expect(emailSubject(locale, key).length).toBeGreaterThan(0);
      }
    }
  });

  it("renders every body template without throwing", () => {
    for (const locale of locales) {
      for (const key of bodies) {
        const body = emailBody(locale, key, [
          "Test User",
          "test update",
          "https://myimmflow.com/dashboard",
        ]);
        expect(body).toEqual(expect.any(String));
        expect(body.length).toBeGreaterThan(10);
      }
    }
  });

  it("fails safely for an unknown body key", () => {
    expect(emailBody("en", "unknown", ["Test User"])).toContain("ImmFlow");
  });
});
