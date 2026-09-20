import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { parseServiceIntent } from "../utils/service-finder.js";

describe("service finder rules remain stable", () => {
  it("maps birth certificate translation", () => {
    const r = parseServiceIntent(
      "I need to translate my birth certificate from Hindi to English"
    );
    expect(r.categorySlug).toBe("translation");
    expect(r.filters.sourceLanguage).toBe("Hindi");
    expect(r.filters.targetLanguage).toBe("English");
  });
});

describe("normalize via resolveServiceIntent without API key", async () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to rules", async () => {
    // Dynamic import after env stub
    const { resolveServiceIntent } = await import("../services/service-finder-ai.js");
    const r = await resolveServiceIntent("Spanish interpreter for my immigration interview");
    expect(r.categorySlug).toBe("interpreter");
    expect(r.source).toBe("rules");
  });
});
