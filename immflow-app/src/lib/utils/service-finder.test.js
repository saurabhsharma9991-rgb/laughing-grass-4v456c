import { describe, expect, it } from "vitest";
import { parseServiceIntent } from "./service-finder.js";

describe("parseServiceIntent", () => {
  it("detects certified translation", () => {
    const r = parseServiceIntent("I need a certified Hindi to English translation of my birth certificate");
    expect(r.categorySlug).toBe("translation");
    expect(r.filters.sourceLanguage).toBe("Hindi");
    expect(r.filters.targetLanguage).toBe("English");
    expect(r.filters.certified).toBe(true);
  });

  it("ignores non-language 'to' phrases", () => {
    const r = parseServiceIntent("I need to translate my birth certificate from Hindi to English");
    expect(r.categorySlug).toBe("translation");
    expect(r.filters.sourceLanguage).toBe("Hindi");
    expect(r.filters.targetLanguage).toBe("English");
  });

  it("detects interpreter intent", () => {
    const r = parseServiceIntent("Spanish interpreter for my immigration interview");
    expect(r.categorySlug).toBe("interpreter");
  });

  it("detects psychological evaluation", () => {
    const r = parseServiceIntent("I need an immigration psychological evaluation");
    expect(r.categorySlug).toBe("psychological");
  });

  it("defaults toward attorney for legal wording", () => {
    const r = parseServiceIntent("Need hearing coverage for removal defense");
    expect(r.categorySlug).toBe("attorney");
  });
});
