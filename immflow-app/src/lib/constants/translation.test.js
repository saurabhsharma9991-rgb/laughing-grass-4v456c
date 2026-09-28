import { describe, expect, it } from "vitest";
import {
  quoteTranslationCents,
  providerQuoteBaseCents,
  defaultCertificationNote,
  PROVIDER_STATUS_FLOW,
} from "./translation.js";

describe("quoteTranslationCents", () => {
  it("applies certified and rush multipliers", () => {
    const base = quoteTranslationCents({ translationType: "standard", turnaround: "regular" });
    const certified = quoteTranslationCents({ translationType: "certified", turnaround: "regular" });
    const rush = quoteTranslationCents({ translationType: "standard", turnaround: "rush" });
    expect(certified).toBeGreaterThan(base);
    expect(rush).toBeGreaterThan(base);
  });

  it("ignores a per-word display rate and keeps the flat starting price", () => {
    expect(
      providerQuoteBaseCents({
        rate: "$0.18/word",
        profileData: { basePriceCents: 4900 },
      })
    ).toBe(4900);
    expect(providerQuoteBaseCents({ rate: "$0.18/word" })).toBeNull();
    expect(
      quoteTranslationCents({
        translationType: "standard",
        turnaround: "regular",
        providerBaseCents: providerQuoteBaseCents({ rate: "$0.18/word" }),
      })
    ).toBe(4900);
  });

  it("uses provider base when provided", () => {
    expect(
      quoteTranslationCents({
        translationType: "standard",
        turnaround: "regular",
        providerBaseCents: 10000,
      })
    ).toBe(10000);
  });
});

describe("defaultCertificationNote", () => {
  it("avoids blanket USCIS certified claim", () => {
    const note = defaultCertificationNote("certified");
    expect(note).toMatch(/does not claim/i);
    expect(note.toLowerCase()).not.toMatch(/^this translation is uscis certified/);
  });
});

describe("PROVIDER_STATUS_FLOW", () => {
  it("includes delivered after completed", () => {
    expect(PROVIDER_STATUS_FLOW.completed).toContain("delivered");
  });
});
